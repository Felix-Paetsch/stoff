import { CONF } from "@/Core/config";

import { Fraction } from "@/Core/numerics";
import {
    wasm_geometry_closest_shape_positions,
    wasm_geometry_geometries_intersect,
    wasm_geometry_shape_intersections,
    wasm_geometry_shape_self_intersections,
    wasm_geometry_shape_self_intersects,
    WASMCompatability,
} from "Rust/exports";
import { BoundingBox } from "../bounding_box";
import {
    buffer,
    BufferLineCapStyle,
    BufferLineJoinStyle,
} from "../finite_geometry";
import { Geometry } from "../index";
import { Line } from "../line";
import { Ray } from "../ray";
import { Radians } from "../types";
import {
    make_line_to_relevant_polyline_for_closest_vec,
    make_ray_to_relevant_polyline_for_closest_vec,
} from "../utils/closest_vector";
import { Vector } from "../vector";
import {
    get_appreciable_corner,
    get_appreciable_line_segment,
} from "./internal_shape_algorithms/appreciable_line_segment";
import { shape_corners } from "./internal_shape_algorithms/corners";
import { curvature } from "./internal_shape_algorithms/curvature";
import { vectors_from_polyline_function } from "./internal_shape_algorithms/from_function";
import { LengthMap } from "./length_map";
import { Polygon } from "./polygon";
import { Polyline } from "./polyline";
import { decode_intersection_positions } from "./rust_utils/decode_intersection_positions";

export namespace Shape {
    export type PolylineFunction = (t: Fraction) => Vector;
    export type PolygonFunction = (t: Fraction) => Vector;
    export type ShapeFunction = (t: Fraction) => Vector;
    export type ShapePosition = {
        vec: Vector;
        index: number; // Line segment index
        frac: Fraction; // Fraction to next
    };
    export type Shape = Polyline | Polygon;
    export type ShapePositionDescriptor =
        | number
        | [number, "relative" | "absolute"]
        | Vector
        | Shape.ShapePosition
        | "start"
        | LengthMap.Position
        | "end";
}

export abstract class Shape {
    private _length_map: LengthMap.Map | null = null;
    private _positions: Float64Array | null = null;
    private _vertices: Vector[] | null = null;
    private _bb: BoundingBox | null = null;

    constructor(positions: Float64Array | Vector[]) {
        if (positions instanceof Float64Array) {
            this._positions = positions;
        } else {
            this._vertices = positions;
        }
    }

    abstract vertex_at(pos: number): Vector | undefined;

    get vertices(): Vector[] {
        if (this._vertices) return this._vertices;

        this._vertices = [];
        for (let i = 0; i < this.positions.length; i += 2) {
            this.vertices.push(
                new Vector(this.positions[i]!, this.positions[i + 1]!),
            );
        }
        return this._vertices;
    }

    get positions(): Float64Array {
        if (this._positions) return this._positions;

        this._positions = new Float64Array(this.vertices.length * 2);
        for (let i = 0; i < this.vertices.length; i++) {
            this._positions[2 * i]! = this.vertices[i]!.x;
            this._positions[2 * i + 1]! = this.vertices[i]!.y;
        }

        return this._positions;
    }

    length_map_ref(): LengthMap.Map {
        if (this._length_map == null) {
            this._length_map = LengthMap.compute(this.vertices);
        }

        return this._length_map;
    }

    length(): number {
        const m = this.length_map_ref();
        return m[m.length - 1]!;
    }

    length_until(until: Shape.ShapePositionDescriptor): number | null {
        const pos = this.shape_point_descriptor_to_shape_position(until);
        if (pos === null) return null;
        return LengthMap.length_at(this.length_map_ref(), pos);
    }

    bounding_box(): BoundingBox {
        if (this._bb) return this._bb;
        this._bb = BoundingBox.from_vectors(this.vertices);
        return this._bb;
    }

    sample(
        at: number,
        is_relative: "relative" | "absolute" = "relative",
    ): Vector | null {
        let r = this.shape_position_at_length(at, is_relative);
        if (!r) return r;
        return r.vec;
    }

    abstract as_polyline(): Polyline;

    abstract as_polygon(): Polygon;

    typesafe(): Polygon | Polyline {
        return this as any;
    }

    is_polygon(): this is Polygon {
        return this instanceof Polygon;
    }

    is_polyline(): this is Polyline {
        return !this.is_polygon();
    }

    vertex_count(): number {
        if (this._vertices) {
            return this._vertices.length;
        }

        return this._positions!.length / 2;
    }

    linesegment_count(): number {
        if (this.is_empty()) return 0;
        if (this.is_polyline()) return this.vertex_count() - 1;
        return this.vertex_count();
    }

    is_empty(): boolean {
        return this.vertex_count() == 0;
    }

    is_convex(): boolean {
        const l = this.as_polygon();
        if (l.vertex_count() < 3) {
            return true;
        }

        const pts = l.vertices;
        const n = pts.length;

        let sign = 0;
        for (let i = 0; i < n; i++) {
            const p0 = pts[i]!;
            const p1 = pts[(i + 1) % n]!;
            const p2 = pts[(i + 2) % n]!;

            const v1 = p1.subtract(p0);
            const v2 = p2.subtract(p1);
            const cross = v1.cross(v2);

            if (Math.abs(cross) <= CONF.core_approximately_zero) continue;

            if (sign === 0) {
                sign = Math.sign(cross);
            } else if (Math.sign(cross) !== sign && Math.sign(cross) !== 0) {
                return false;
            }
        }
        return true;
    }

    is_strictly_convex(): boolean {
        const l = this.as_polygon();
        if (l.vertex_count() < 3) {
            return false;
        }

        const pts = l.vertices;
        const n = pts.length;

        let sign = 0;
        for (let i = 0; i < n; i++) {
            const p0 = pts[i]!;
            const p1 = pts[(i + 1) % n]!;
            const p2 = pts[(i + 2) % n]!;

            const v1 = p1.subtract(p0);
            const v2 = p2.subtract(p1);
            const cross = v1.cross(v2);

            if (cross == 0) {
                return false;
            }

            if (sign === 0) {
                sign = Math.sign(cross);
            } else if (Math.sign(cross) !== sign) {
                return false;
            }
        }
        return true;
    }

    static from_function(
        fn: Shape.ShapeFunction,
        start_points?: number,
        sample_spacing?: number,
    ): Shape.Shape {
        const vectors = vectors_from_polyline_function(
            fn,
            sample_spacing,
            start_points,
        );
        const line = new Polyline(vectors);

        if (line.is_polygon()) {
            return line.to_polygon();
        }

        return line;
    }

    closest_shape_position(
        from: Geometry.Geometry,
    ): Shape.ShapePosition | null {
        let fShape: Shape;

        if (from instanceof Shape) {
            fShape = from;
        } else if (from instanceof Line) {
            fShape = make_line_to_relevant_polyline_for_closest_vec(from, this);
        } else if (from instanceof Ray) {
            fShape = make_ray_to_relevant_polyline_for_closest_vec(from, this);
        } else if (Array.isArray(from)) {
            fShape = new Polyline(from);
        } else {
            fShape = new Polyline([from]);
        }

        const res = Shape.closest_shape_positions(this, fShape);
        if (!res) return res;

        return res[0];
    }

    shape_position_at_length(
        at: number,
        relative: "relative" | "absolute" = "relative",
    ): Shape.ShapePosition | null {
        const l = this.as_polyline();

        const totalLength = l.length();
        let targetDistance = relative === "relative" ? at * totalLength : at;

        if (this instanceof Polygon) {
            targetDistance = targetDistance % totalLength;
        }

        if (targetDistance < 0) {
            targetDistance = totalLength + targetDistance;
        }

        targetDistance = Math.min(Math.max(0, targetDistance), totalLength);

        const pos = LengthMap.position_at_length(
            this.length_map_ref(),
            targetDistance,
        );
        const vec = Vector.lerp(
            this.vertices[pos.index]!,
            this.vertices[pos.index + 1]!,
            pos.frac,
        );

        return {
            ...pos,
            vec,
        };
    }

    normal_vector(at: Shape.ShapePositionDescriptor): Vector | null {
        const at_descr = this.shape_point_descriptor_to_shape_position(at);
        if (!at_descr) return null;

        const l = get_appreciable_line_segment(this.typesafe(), at_descr.index);
        if (!l) return null;

        return l[1].subtract(l[0]).orthonormal();
    }

    normal_line(at: Shape.ShapePositionDescriptor): Line | null {
        const at_descr = this.shape_point_descriptor_to_shape_position(at);
        if (!at_descr) return null;

        const l = get_appreciable_line_segment(this.typesafe(), at_descr.index);
        if (!l) return null;

        const dir = l[1].subtract(l[0]).orthogonal();
        return Line.from_direction(at_descr.vec, dir);
    }

    tangent_vector(at: Shape.ShapePositionDescriptor): Vector | null {
        const at_descr = this.shape_point_descriptor_to_shape_position(at);
        if (!at_descr) return null;

        const l = get_appreciable_line_segment(this.typesafe(), at_descr.index);
        if (!l) return null;

        return l[1].subtract(l[0]).normalize();
    }

    tangent_line(at: Shape.ShapePositionDescriptor): Line | null {
        const at_descr = this.shape_point_descriptor_to_shape_position(at);
        if (!at_descr) return null;

        const l = get_appreciable_line_segment(this.typesafe(), at_descr.index);
        if (!l) return null;

        const dir = l[1].subtract(l[0]);
        return Line.from_direction(at_descr.vec, dir);
    }

    curvature(
        at: Shape.ShapePositionDescriptor,
        scale: number = CONF.core_approximately_zero,
    ): number | null {
        return curvature(this.typesafe(), at, scale);
    }

    static closest_shape_positions(
        sh1: Shape,
        sh2: Shape,
    ): [Shape.ShapePosition, Shape.ShapePosition] | null {
        const wsh1 = WASMCompatability.Geometry.wasm_shape(sh1 as Shape.Shape);
        const wsh2 = WASMCompatability.Geometry.wasm_shape(sh2 as Shape.Shape);
        const closest = wasm_geometry_closest_shape_positions(wsh1, wsh2);

        WASMCompatability.Allocations.free(wsh1, wsh2);

        if (!closest) return null;
        closest.forEach((c) => WASMCompatability.Allocations.allocate(c));

        return [
            WASMCompatability.Geometry.shape_position_from_wasm(closest[0]!),
            WASMCompatability.Geometry.shape_position_from_wasm(closest[1]!),
        ];
    }

    intersection_positions(g: Geometry.Geometry): Shape.ShapePosition[] {
        let gShape: Shape;

        if (g instanceof Shape) {
            gShape = g;
        } else if (g instanceof Line) {
            gShape = make_line_to_relevant_polyline_for_closest_vec(g, this);
        } else if (g instanceof Ray) {
            gShape = make_ray_to_relevant_polyline_for_closest_vec(g, this);
        } else if (Array.isArray(g)) {
            gShape = new Polyline(g);
        } else {
            gShape = new Polyline([g]);
        }

        return Shape.intersection_positions(this, gShape).map((p) => p[0]);
    }

    self_intersection_positions(): [
        Shape.ShapePosition,
        Shape.ShapePosition,
    ][] {
        if (this.vertex_count() < 3) return [];
        let r = WASMCompatability.Allocations.free_after_use(
            WASMCompatability.Geometry.wasm_shape(
                this as unknown as Shape.Shape,
            ),
            (s) => wasm_geometry_shape_self_intersections(s),
        );
        return decode_intersection_positions(r!);
    }

    intersects(g: Geometry.Geometry): boolean {
        let gShape: Shape;

        if (g instanceof Shape) {
            gShape = g;
        } else if (g instanceof Line) {
            gShape = make_line_to_relevant_polyline_for_closest_vec(g, this);
        } else if (g instanceof Ray) {
            gShape = make_ray_to_relevant_polyline_for_closest_vec(g, this);
        } else if (Array.isArray(g)) {
            gShape = new Polyline(g);
        } else {
            gShape = new Polyline([g]);
        }

        const wsh1 = WASMCompatability.Geometry.wasm_geometry(this);
        const wsh2 = WASMCompatability.Geometry.wasm_geometry(gShape);

        const res = wasm_geometry_geometries_intersect(wsh1, wsh2) || false;

        WASMCompatability.Allocations.free(wsh1, wsh2);
        return res;
    }

    self_intersects(): boolean {
        if (this.vertex_count() < 3) return false;
        let r = WASMCompatability.Allocations.free_after_use(
            WASMCompatability.Geometry.wasm_shape(this.typesafe()),
            (s) => wasm_geometry_shape_self_intersects(s),
        );

        return r || false;
    }

    corners(threshold_angle: Radians = Math.PI / 6): Shape.ShapePosition[] {
        return shape_corners(this.typesafe(), threshold_angle);
    }

    proper_components(): Shape[] {
        throw new Error();
    }

    static intersection_positions(
        sh1: Shape,
        sh2: Shape,
    ): [Shape.ShapePosition, Shape.ShapePosition][] {
        const shl1 = WASMCompatability.Geometry.wasm_shape(sh1.as_polyline());
        const shl2 = WASMCompatability.Geometry.wasm_shape(sh2.as_polyline());

        const ip_arr = wasm_geometry_shape_intersections(shl1, shl2);
        WASMCompatability.Allocations.free(shl1, shl2);

        if (!ip_arr) return [];

        return decode_intersection_positions(ip_arr!);
    }

    buffer(
        distance: number,

        joinstyle: BufferLineJoinStyle = "round",
        capstyle: BufferLineCapStyle = "round",
    ): Polygon[] {
        return buffer([this], distance, joinstyle, capstyle);
    }

    abstract reverse(): Shape;

    shape_point_descriptor_to_shape_position(
        d: Shape.ShapePositionDescriptor,
    ): Shape.ShapePosition | null {
        if (this.vertex_count() == 0) return null;
        if (d instanceof Vector) return this.closest_shape_position(d);
        if (typeof d == "number") return this.shape_position_at_length(d);
        if (d == "start") {
            return {
                vec: this.vertices[0]!,
                index: 0,
                frac: 0,
            };
        }
        if (this.vertex_count() == 1) {
            return {
                vec: this.vertices[0]!,
                index: 0,
                frac: 0,
            };
        }
        if (d == "end") {
            if (this instanceof Polyline) {
                return {
                    vec: this.last()!,
                    index: this.vertex_count() - 2,
                    frac: 1,
                };
            }

            return {
                vec: this.vertices[0]!,
                index: this.vertex_count() - 1,
                frac: 1,
            };
        }
        if (Array.isArray(d)) {
            return this.shape_position_at_length(d[0], d[1]);
        }
        if (!("vec" in d)) {
            return {
                ...d,
                vec: Vector.lerp(
                    this.vertices[d.index]!,
                    this.vertices[d.index + 1]!,
                    d.frac,
                ),
            };
        }
        return d;
    }

    vector_at(d: Shape.ShapePositionDescriptor): Vector | null {
        const p = this.shape_point_descriptor_to_shape_position(d);
        return p ? p.vec : p;
    }

    static empty(): Shape.Shape {
        return new Polyline([]);
    }

    static _get_appreciable_line_segment(
        shape: Shape,
        line_segment_index: number,
    ) {
        return get_appreciable_line_segment(
            shape.typesafe(),
            line_segment_index,
        );
    }

    static _get_appreciable_corner(shape: Polygon | Polyline, at: number) {
        return get_appreciable_corner(shape.typesafe(), at);
    }
}
