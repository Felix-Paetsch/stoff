import {
    wasm_geometry_closest_shape_positions,
    wasm_geometry_geometries_intersect,
    wasm_geometry_shape_intersections,
    wasm_geometry_shape_selfintersections,
    wasm_geometry_shape_selfintersects,
    WASMCompatability,
} from "Rust/exports";
import { EPS } from "../../numerics";
import { BoundingBox } from "../bounding_box";
import {
    buffer,
    BufferLineCapStyle,
    BufferLineJoinStyle,
} from "../finite_geometry";
import { Geometry } from "../index";
import { Fraction } from "../interval";
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
} from "./algorithms/appreciable_line_segment";
import { shape_corners } from "./algorithms/corners";
import { vectors_from_polyline_function } from "./algorithms/from_function";
import { merge } from "./algorithms/merge";
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
        | "end";
}

export abstract class Shape {
    private _length: number | null = null;
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

    get vertices(): Vector[] {
        if (this._vertices) return this._vertices;

        this._vertices = WASMCompatability.Geometry.vecf64_to_vertex_vec(
            this.positions,
        );
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

    length(): number {
        if (this._length !== null) {
            return this._length;
        }

        this._length = this.length_until("end");
        return this._length!;
    }

    length_until(until: Shape.ShapePositionDescriptor): number | null {
        const at_descr = this.shape_point_descriptor_to_shape_position(until);
        if (!at_descr) return null;

        const l = this.as_polyline();
        let len = 0;
        let ver = l.vertices;
        for (let i = 0; i < at_descr.index; i++) {
            len += ver[i]!.distance(ver[i + 1]!);
        }

        if (at_descr.frac > 0) {
            len +=
                ver[at_descr.index]!.distance(ver[at_descr.index + 1]!) *
                at_descr.frac;
        }
        return len;
    }

    bounding_box(): BoundingBox {
        if (this._bb) return this._bb;
        this._bb = BoundingBox.from_vectors(this.vertices);
        return this._bb;
    }

    sample(
        at: number,
        is_relative: "relative" | "absolute" = "relative",
    ): Vector {
        return this.shape_position_at_length(at, is_relative).vec;
    }

    abstract as_polyline(): Polyline;

    abstract as_polygon(): Polygon;

    typesafe(): Polygon | Polyline {
        return this as any;
    }

    get vertex_count(): number {
        if (this._vertices) {
            return this._vertices.length;
        }

        return this._positions!.length / 2;
    }

    is_empty(): boolean {
        return this.vertex_count == 0;
    }

    is_convex(): boolean {
        const l = this.as_polygon();
        if (l.vertex_count < 3) {
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

            if (EPS.less_than(Math.abs(cross), 0)) continue;

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
        if (l.vertex_count < 3) {
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

    static from_function(fn: Shape.ShapeFunction): Shape.Shape {
        const vectors = vectors_from_polyline_function(fn);
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

        // console.log(
        //     "CLOSEST SHAPE POST",
        //     res,
        //     this.vertices[0],
        //     this.vertices[this.vertex_count - 1],
        //     this.vertex_count,
        // );

        return res[0];
    }

    shape_position_at_length(
        at: number,
        relative: "relative" | "absolute" = "relative",
    ): Shape.ShapePosition {
        const l = this.as_polyline();

        const totalLength = l.length();
        let targetDistance = relative === "relative" ? at * totalLength : at;

        if (this instanceof Polygon) {
            targetDistance = targetDistance % totalLength;
        }

        if (targetDistance < 0) {
            targetDistance = totalLength - targetDistance;
        }

        const vec = l.vertices;

        let currentDistance = 0;
        for (let i = 0; i < vec.length - 1; i++) {
            const segmentLength = vec[i]!.distance(vec[i + 1]!);
            const nextDistance = currentDistance + segmentLength;

            if (targetDistance <= nextDistance) {
                const t =
                    segmentLength === 0
                        ? 0
                        : (targetDistance - currentDistance) / segmentLength;
                return {
                    vec: Vector.lerp(vec[i]!, vec[i + 1]!, t),
                    index: i,
                    frac: t,
                };
            }

            currentDistance = nextDistance;
        }

        return {
            vec: vec[vec.length - 1]!,
            index: vec.length - 2,
            frac: 1,
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
        scale: number = EPS.tiny,
    ): number | null {
        const at_descr = this.shape_point_descriptor_to_shape_position(at);
        if (!at_descr) return null;

        const at_len = this.length_until(at_descr)!;
        const total_len = this.length();

        let actual_scale = scale;

        if (this instanceof Polyline) {
            actual_scale = Math.min(scale, at_len, total_len - at_len);

            // Keep your original "factor of 2" guard first.
            if (actual_scale < scale / 2) {
                actual_scale = scale / 2;
            }
        }

        if (actual_scale <= 0) return null;

        let prev: Vector;
        let next: Vector;

        const prev_len = at_len - actual_scale;
        const next_len = at_len + actual_scale;

        if (this instanceof Polygon) {
            prev = this.shape_position_at_length(prev_len).vec;
            next = this.shape_position_at_length(next_len).vec;
        } else {
            const poly = this as any as Polyline;

            if (prev_len >= 0) {
                prev = poly.shape_position_at_length(prev_len).vec;
            } else {
                const start = poly.first();
                if (!start) return null;

                const tangent = poly.tangent_vector("start");
                if (!tangent) return null;

                prev = start.subtract(tangent.scale(-prev_len));
            }

            if (next_len <= total_len) {
                next = poly.shape_position_at_length(next_len).vec;
            } else {
                const end = poly.last();
                if (!end) return null;

                const tangent = poly.tangent_vector("end");
                if (!tangent) return null;

                next = end.add(tangent.scale(next_len - total_len));
            }
        }

        const a = at_descr.vec.distance(prev);
        const b = at_descr.vec.distance(next);
        const c = next.distance(prev);

        if (EPS.is_zero(a) || EPS.is_zero(b) || EPS.is_zero(c)) {
            return 0;
        }

        const area = new Polygon([prev, next, at_descr.vec]).area();
        if (EPS.is_zero(area)) {
            return 0;
        }

        const curvature = (4 * area) / (a * b * c);
        return (curvature * scale) / actual_scale;
    }

    static closest_shape_positions(
        sh1: Shape,
        sh2: Shape,
    ): [Shape.ShapePosition, Shape.ShapePosition] | null {
        const p1 = sh1.as_polygon();
        const p2 = sh2.as_polygon();

        const closest = wasm_geometry_closest_shape_positions(
            p1.to_wasm_vecf64(),
            p2.to_wasm_vecf64(),
        );

        if (!closest) return null;

        return [
            {
                vec: new Vector(closest[0]!, closest[1]!),
                index: Math.round(closest[2]!),
                frac: closest[3]!,
            },
            {
                vec: new Vector(closest[4]!, closest[5]!),
                index: Math.round(closest[6]!),
                frac: closest[7]!,
            },
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
        if (this.vertex_count < 3) return [];
        let r = wasm_geometry_shape_selfintersections(this.to_wasm_vecf64());
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

        return (
            wasm_geometry_geometries_intersect(
                this.to_wasm_vecf64(),
                gShape.to_wasm_vecf64(),
            ) || false
        );
    }

    self_intersects(): boolean {
        if (this.vertex_count < 3) return false;
        let r = wasm_geometry_shape_selfintersects(this.to_wasm_vecf64());
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
        const shl1 = sh1.as_polyline();
        const shl2 = sh2.as_polyline();

        const ip_arr = wasm_geometry_shape_intersections(
            shl1.to_wasm_vecf64(),
            shl2.to_wasm_vecf64(),
        );
        if (!ip_arr) return [];

        return decode_intersection_positions(ip_arr!);
    }

    static merge(sh1: Polygon, sh2: Polygon): Polygon;
    static merge(sh1: Polyline, sh2: Polygon): Polyline;
    static merge(sh1: Polygon, sh2: Polyline): Polyline;
    static merge(sh1: Polyline, sh2: Polyline): Polyline;
    static merge(sh1: Shape, sh2: Shape): Shape.Shape;
    static merge(sh1: Shape, sh2: Shape): Shape {
        return merge(sh1, sh2);
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
        if (this.vertex_count == 0) return null;
        if (d instanceof Vector) return this.closest_shape_position(d);
        if (typeof d == "number") return this.shape_position_at_length(d);
        if (d == "start") {
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
                    index: this.vertex_count - 2,
                    frac: 1,
                };
            }

            return {
                vec: this.vertices[0]!,
                index: this.vertex_count - 1,
                frac: 1,
            };
        }
        if (Array.isArray(d)) {
            return this.shape_position_at_length(d[0], d[1]);
        }
        return d;
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

    to_wasm_vecf64(): Float64Array {
        return WASMCompatability.Geometry.geometry_to_vecf64(this.typesafe());
    }

    static from_wasm_vecf64(from: Float64Array): Shape.Shape {
        let obj = WASMCompatability.Geometry.vecf64_to_geometry(from);
        if (obj instanceof Vector) return new Polygon([obj]);
        return obj as Shape.Shape;
    }
}
