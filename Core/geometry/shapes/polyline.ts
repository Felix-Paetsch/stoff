export * from ".";

import { resample_line_points } from "./manipulations/resample";
import { polyline_smooth_out } from "../../../ShapeManipulation/smooth_out";
import { Polygon } from "./polygon";
import { PolylineFunction, PolylineVectors } from ".";
import { Vector } from "../classes";
import {
    Fraction,
    Interval,
    remap_interval,
    reparameterize,
    UnitInterval,
} from "../1d";
import { expect } from "@/Core/expect";
import { Radians } from "../types";
import { is_convex } from "../algorithms";

export type PolylinePosition = {
    pos: Vector;
    i: number; // Previous index
    f: Fraction; // Fraction to next point
};

export class Polyline {
    constructor(private vec: PolylineVectors) {
        expect(vec.length >= 1);
    }

    get verticies() {
        return [...this.vec];
    }

    set verticies(verticies: Vector[]) {
        this.vec = [...verticies];
    }

    first() {
        return this.vec[0]!;
    }

    last() {
        return this.vec[this.vec.length - 1]!;
    }

    resample(
        sample_spacing: number | null = null,
        smoothness_angle: Radians = Math.PI * 1.2, // Low angle leads to smoothing even around sharper corners
    ) {
        return new Polyline(
            resample_line_points(this.vec, sample_spacing, smoothness_angle),
        );
    }

    smooth_out(ker_size: number = 0.1, sample_spacing: number | null = null) {
        this.vec = polyline_smooth_out(this.vec, ker_size, sample_spacing);
    }

    map(fn: (v: Vector, i: number) => Vector) {
        return new Polyline(this.vec.map(fn));
    }

    reverse(): Polyline {
        return new Polyline([...this.vec].reverse());
    }

    length(): number {
        let total = 0;
        for (let i = 0; i < this.vec.length - 1; i++) {
            total += this.vec[i]!.distance(this.vec[i + 1]!);
        }
        return total;
    }

    sample(at: number, relative: boolean = true): Vector {
        const totalLength = this.length();
        let targetDistance = relative ? at * totalLength : at;
        if (targetDistance < 0) {
            targetDistance = totalLength - targetDistance;
        }

        let currentDistance = 0;
        for (let i = 0; i < this.vec.length - 1; i++) {
            const segmentLength = this.vec[i]!.distance(this.vec[i + 1]!);
            const nextDistance = currentDistance + segmentLength;

            if (targetDistance <= nextDistance) {
                const t =
                    segmentLength === 0
                        ? 0
                        : (targetDistance - currentDistance) / segmentLength;
                return Vector.lerp(this.vec[i]!, this.vec[i + 1]!, t);
            }

            currentDistance = nextDistance;
        }

        return this.vec[this.vec.length - 1]!;
    }

    slice(from: number = 0, to: number = 1, relative: boolean = true) {
        const l = this.length();
        if (relative) {
            from *= l;
            to *= l;
        }
        if (from < 0) {
            from = l - from;
        }
        if (to < 0) {
            to = l - to;
        }

        const flipped = from > to;
        if (flipped) {
            const t = to;
            to = from;
            from = t;
        }

        let res: Vector[] = [];
        let currentDistance = 0;

        if (from == 0) {
            res.push(this.first());
        }

        for (let i = 0; i < this.vec.length - 1; i++) {
            const segmentLength = this.vec[i]!.distance(this.vec[i + 1]!);
            const nextDistance = currentDistance + segmentLength;

            if (from > nextDistance) {
                currentDistance = nextDistance;
                continue;
            } else if (from <= nextDistance && from > currentDistance) {
                const t =
                    segmentLength === 0
                        ? 0
                        : (from - currentDistance) / segmentLength;

                res.push(Vector.lerp(this.vec[i]!, this.vec[i + 1]!, t));
                currentDistance = nextDistance;
                continue;
            }

            if (to <= nextDistance) {
                const t =
                    segmentLength === 0
                        ? 0
                        : (to - currentDistance) / segmentLength;

                res.push(Vector.lerp(this.vec[i]!, this.vec[i + 1]!, t));
                break;
            } else {
                res.push(this.vec[i]!);
            }

            currentDistance = nextDistance;
        }

        if (flipped) {
            res.reverse();
        }

        return new Polyline(res);
    }

    to_polygon(): Polygon {
        return new Polygon(this.vec);
    }

    static from_polyline_function(_fn: PolylineFunction): Polyline {
        // do binary search while adding the points you find
        // also check first and last point, but dont include last point
        throw new Error();
    }

    static from_function_graph(
        f: (x: number) => number,
        range: Interval = UnitInterval,
    ) {
        return Polyline.from_polyline_function(
            reparameterize(
                (t) => new Vector(t, f(t)),
                remap_interval(range, UnitInterval),
            ),
        );
    }

    is_convex() {
        return is_convex(this.verticies);
    }
}
