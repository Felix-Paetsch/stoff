import { Vector } from "../vector";
import { Polygon } from "./polygon";
import { Polyline } from "./polyline";
import { BoundingBox } from "../bounding_box";
import { EPS } from "../../numerics";
import { Fraction } from "../interval";
import { vectors_from_polyline_function } from "./algorithms/from_function";
import { Geometry, Line, Ray } from "..";
import {
    make_line_to_relevant_polyline,
    make_ray_to_relevant_polyline,
} from "../geometry/closest_vector";
import { closest_points, f64_to_vec_array } from "@/Core/rust/exports";

export namespace Shape {
    export type PolylineFunction = (t: Fraction) => Vector;
    export type PolygonFunction = (t: Fraction) => Vector;
    export type ShapeFunction = (t: Fraction) => Vector;
    export type ShapePosition = {
        vec: Vector;
        index: number; // Line segment index
        frac: Fraction; // Fraction to next
    };
}

export abstract class Shape implements Iterable<Vector> {
    private _length: number | null = null;
    private _positions: Float64Array | null = null;
    private _verticies: Vector[] | null = null;
    private _bb: BoundingBox | null = null;

    constructor(positions: Float64Array | Vector[]) {
        if (positions instanceof Float64Array) {
            this._positions = positions;
        } else {
            this._verticies = positions;
        }
    }

    *[Symbol.iterator](): Iterator<Vector> {
        return this.verticies!;
    }

    get verticies(): Vector[] {
        if (this._verticies) return this._verticies;

        this._verticies = f64_to_vec_array(this.positions);
        return this._verticies;
    }

    get positions(): Float64Array {
        if (this._positions) return this._positions;

        this._positions = new Float64Array(this.verticies.length * 2);
        for (let i = 0; i < this.verticies.length; i++) {
            this._positions[2 * i]! = this.verticies[i]!.x;
            this._positions[2 * i + 1]! = this.verticies[i]!.y;
        }

        return this._positions;
    }

    length(): number {
        if (this._length !== null) {
            return this._length;
        }

        const l = this.as_polyline();
        let len = 0;
        let ver = l.verticies;
        for (let i = 0; i < ver.length - 1; i++) {
            len += ver[i]!.distance(ver[i + 1]!);
        }

        this._length = len;
        return len;
    }

    bounding_box(): BoundingBox {
        if (this._bb) return this._bb;
        this._bb = BoundingBox.from_points(this.verticies);
        return this._bb;
    }

    sample(at: number, relative: boolean = true): Vector {
        const l = this.as_polyline();

        const totalLength = l.length();
        let targetDistance = relative ? at * totalLength : at;
        if (targetDistance < 0) {
            targetDistance = totalLength - targetDistance;
        }

        const vec = l.verticies;

        let currentDistance = 0;
        for (let i = 0; i < vec.length - 1; i++) {
            const segmentLength = vec[i]!.distance(vec[i + 1]!);
            const nextDistance = currentDistance + segmentLength;

            if (targetDistance <= nextDistance) {
                const t =
                    segmentLength === 0
                        ? 0
                        : (targetDistance - currentDistance) / segmentLength;
                return Vector.lerp(vec[i]!, vec[i + 1]!, t);
            }

            currentDistance = nextDistance;
        }

        return vec[vec.length - 1]!;
    }

    as_polyline(): Polyline {
        if (this instanceof Polyline) {
            return this;
        }
        if (this instanceof Polygon) {
            return this.to_polyline();
        }

        throw new Error("Unknown shape");
    }

    as_polygon(): Polygon {
        if (this instanceof Polygon) {
            return this;
        }
        if (this instanceof Polyline) {
            return this.to_polygon();
        }

        throw new Error("Unknown shape");
    }

    typesafe(): Polygon | Polyline {
        return this as any;
    }

    get vertex_count(): number {
        if (this._verticies) {
            return this._verticies.length;
        }

        return this._positions!.length / 2;
    }

    is_convex(): boolean {
        const l = this.as_polygon();
        if (l.vertex_count < 4) {
            return true;
        }

        const pts = l.verticies;
        const n = pts.length;
        if (n < 3) return true;

        let sign = 0;
        for (let i = 0; i < n; i++) {
            const p0 = pts[i]!;
            const p1 = pts[(i + 1) % n]!;
            const p2 = pts[(i + 2) % n]!;

            const v1 = p1.subtract(p0);
            const v2 = p2.subtract(p1);
            const cross = v1.cross(v2);

            if (EPS.less_than(cross, 0)) continue;

            if (sign === 0) {
                sign = Math.sign(cross);
            } else if (Math.sign(cross) !== sign) {
                return false;
            }
        }
        return true;
    }

    static from_function(fn: Shape.ShapeFunction): Shape {
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
            fShape = make_line_to_relevant_polyline(from, this);
        } else if (from instanceof Ray) {
            fShape = make_ray_to_relevant_polyline(from, this);
        } else if (Array.isArray(from)) {
            fShape = new Polyline(from);
        } else {
            fShape = new Polyline([from]);
        }

        const res = Shape.closest_shape_positions(this, fShape);
        if (!res) return res;

        return res[0];
    }

    static closest_shape_positions(
        sh1: Shape,
        sh2: Shape,
    ): [Shape.ShapePosition, Shape.ShapePosition] | null {
        const p1 = sh1.as_polygon();
        const p2 = sh2.as_polygon();

        const closest = closest_points(p1.positions, p2.positions);
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
}
