import { resample_polygon_points } from "./manipulations/resample";
import { polygon_smooth_out } from "../../../ShapeManipulation/smooth_out";
import { PolygonFunction, PolygonVectors, Polyline } from "./polyline";
import { expect } from "@/Core/expect";
import { Vector } from "../classes";
import { Radians } from "../types";
import { is_convex } from "../algorithms";

export class Polygon {
    constructor(private readonly vec: PolygonVectors) {
        expect(vec.length >= 1);
    }

    get verticies() {
        return [...this.vec];
    }

    root() {
        return this.vec[0]!;
    }

    orientate_towards(position: Vector): void;
    orientate_towards(index: number): void;
    orientate_towards(_where: number | Vector): void {}

    resample(
        sample_spacing: number | null = null,
        smoothness_angle: Radians = Math.PI * 1.2, // Low angle leads to smoothing even around sharper corners
    ) {
        return new Polygon(
            resample_polygon_points(this.vec, sample_spacing, smoothness_angle),
        );
    }

    smooth_out(ker_size: number = 0.1, sample_spacing: number | null = null) {
        return new Polygon(
            polygon_smooth_out(this.vec, ker_size, sample_spacing),
        );
    }

    map(fn: (v: Vector, i: number) => Vector) {
        return new Polygon(this.vec.map(fn));
    }

    length(): number {
        let total = 0;
        for (let i = 0; i < this.vec.length; i++) {
            total += this.vec[i]!.distance(
                this.vec[(i + 1) % this.vec.length]!,
            );
        }
        return total;
    }

    sample(at: number, relative: boolean = true): Vector {
        return this.to_polyline().sample(at, relative);
    }

    slice(from: number = 0, to: number = 1, relative: boolean = true) {
        return this.to_polyline().slice(from, to, relative);
    }

    to_polyline(): Polyline {
        return new Polyline([...this.verticies, this.root()]);
    }

    static from_polygon_function(
        _fn: PolygonFunction,
        _sample_spacing: number | null = null,
    ): Polygon {
        // do binary search while adding the points you find
        // also check first and last point, but dont include last point
        throw new Error();
    }

    is_convex() {
        return is_convex(this.verticies);
    }

    static rectangle(top_left: Vector, bottom_right: Vector) {
        return new Polygon([
            top_left,
            new Vector(top_left.x, bottom_right.y),
            bottom_right,
        ]);
    }
}
