import { EPS } from "../../numerics";
import {
    buffer,
    closest_points,
    f64_arrays_to_f64,
    f64_to_vec_array,
    intersect_wasm,
    intersects,
    self_intersections_wasm,
    self_intersects,
    split_f64_array,
} from "../../rust/exports";
import { BoundingBox } from "../bounding_box";
import * as Geometry from "../geometry";
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
        // console.log(new Polygon());
        if (positions instanceof Float64Array) {
            this._positions = positions;
        } else {
            this._vertices = positions;
        }
    }

    get vertices(): Vector[] {
        if (this._vertices) return this._vertices;

        this._vertices = f64_to_vec_array(this.positions);
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

        const l = this.as_polyline();
        let len = 0;
        let ver = l.vertices;
        for (let i = 0; i < ver.length - 1; i++) {
            len += ver[i]!.distance(ver[i + 1]!);
        }

        this._length = len;
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

        return res[0];
    }

    shape_position_at_length(
        at: number,
        relative: "relative" | "absolute" = "relative",
    ): Shape.ShapePosition {
        const l = this.as_polyline();

        const totalLength = l.length();
        let targetDistance = relative === "relative" ? at * totalLength : at;
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

    static closest_shape_positions(
        sh1: Shape,
        sh2: Shape,
    ): [Shape.ShapePosition, Shape.ShapePosition] | null {
        const p1 = sh1.as_polygon();
        const p2 = sh2.as_polygon();

        const closest = closest_points(p1.positions, p2.positions);

        console.log(closest, p1.positions, p2.positions);
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
        let r = self_intersections_wasm(
            this.positions,
            this instanceof Polygon,
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

        return intersects(this.positions, gShape.positions);
    }

    self_intersects(): boolean {
        if (this.vertex_count < 3) return false;
        let r = self_intersects(this.positions, this instanceof Polygon);
        return r;
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

        const ip_arr = intersect_wasm(
            shl1.positions,
            sh1 instanceof Polygon,
            shl2.positions,
            sh2 instanceof Polygon,
        );
        if (!ip_arr) return [];

        return decode_intersection_positions(ip_arr!);
    }

    static merge(sh1: Polygon, sh2: Polygon): Polygon;
    static merge(sh1: Polyline, sh2: Polygon): Polyline;
    static merge(sh1: Polygon, sh2: Polyline): Polyline;
    static merge(sh1: Polyline, sh2: Polyline): Polyline;
    static merge(sh1: Shape, sh2: Shape): Shape;
    static merge(sh1: Shape, sh2: Shape): Shape {
        return merge(sh1, sh2);
    }

    buffer(distance: number): Polygon[] {
        return Shape.buffer([this], distance);
    }

    static buffer(shapes: Shape[], distance: number): Polygon[] {
        const positions = shapes.map((s) => s.as_polyline().positions);
        const f64res = buffer(f64_arrays_to_f64(positions), distance);
        const vec_res = split_f64_array(f64res);
        return vec_res.map((r) => new Polygon(r));
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
                    index: this.vertex_count - 1,
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
}
