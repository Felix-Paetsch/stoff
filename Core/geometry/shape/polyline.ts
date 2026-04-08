import { EPS } from "@/Core/numerics";
import { Vector } from "../vector";
import { vectors_from_polyline_function } from "./algorithms/from_function";
import { Polygon } from "./polygon";
import { Shape } from "./shape";
import { resample_line_points } from "./algorithms/resample";
import { Radians } from "../types";
import { resample_strict } from "./algorithms/resample_strict";
import { remove_dub } from "./algorithms/remove_dub";

export class Polyline extends Shape {
    constructor(positions: Float64Array | Vector[]) {
        super(positions);
    }

    first() {
        if (this.positions.length == 0) return null;
        return new Vector(this.positions[0]!, this.positions[1]!);
    }

    last() {
        if (this.positions.length == 0) return null;
        return new Vector(
            this.positions[this.positions.length - 2]!,
            this.positions[this.positions.length - 1]!,
        );
    }

    is_polygon() {
        return this.positions.length < 3 || this.first()!.equals(this.last()!);
    }

    to_polygon() {
        if (this.positions.length < 3) {
            return new Polygon(this.positions);
        }

        if (this.first()!.equals(this.last()!)) {
            return new Polygon(this.positions.slice(0, -1));
        }

        return new Polygon(this.positions);
    }

    static from_verticies(vec: Vector[]): Polyline {
        const length = vec.length * 2;
        const positions = new Float64Array(length);

        let idx = 0;
        // Fill from loops, calculations, etc.
        for (const vertex of vec) {
            positions[idx++] = vertex.x;
            positions[idx++] = vertex.y;
        }

        return new Polyline(positions);
    }

    slice(from: number, to: number, relative: boolean = true): Polyline {
        if (this.positions.length == 0) return new Polyline(new Float64Array());

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
            res.push(this.first()!);
        }

        const vec = this.verticies;

        for (let i = 0; i < vec.length - 1; i++) {
            const segmentLength = vec[i]!.distance(vec[i + 1]!);
            const nextDistance = currentDistance + segmentLength;

            if (from > nextDistance) {
                currentDistance = nextDistance;
                continue;
            } else if (from <= nextDistance && from > currentDistance) {
                const t =
                    segmentLength === 0
                        ? 0
                        : (from - currentDistance) / segmentLength;

                res.push(Vector.lerp(vec[i]!, vec[i + 1]!, t));
                currentDistance = from;
            }

            if (to <= nextDistance) {
                const t =
                    segmentLength === 0
                        ? 0
                        : (nextDistance - to) / segmentLength;

                res.push(Vector.lerp(vec[i]!, vec[i + 1]!, 1 - t));
                break;
            } else {
                res.push(vec[i]!);
            }

            currentDistance = nextDistance;
        }

        if (flipped) {
            res.reverse();
        }

        return Polyline.from_verticies(res);
    }

    map(
        fn: (vec: Vector, len_rel: number, len_abs: number) => Vector,
    ): Polyline {
        const res: Vector[] = [];

        const ver = this.verticies;
        const l = this.length();
        let current_l = 0;

        for (let i = 0; i < ver.length; i++) {
            res.push(fn(ver[i]!, current_l / l, current_l));
        }

        return Polyline.from_verticies(res);
    }

    is_straight(): boolean {
        if (this.vertex_count < 2) {
            return false;
        }

        const endpoint_vec = this.last()!.subtract(this.first()!);
        const verticies = this.verticies;

        for (let i = 0; i < verticies.length - 1; i++) {
            const vec = verticies[i + 1]!.subtract(verticies[i]!);
            const cross = vec.cross(endpoint_vec);

            if (!EPS.is_zero(cross)) return false;
        }

        return true;
    }

    static override from_function(fn: Shape.PolylineFunction): Polyline {
        const vectors = vectors_from_polyline_function(fn);
        return new Polyline(vectors);
    }

    resample(
        smoothness_angle: Radians = Math.PI * 1.2, // Low angle leads to smoothing even around sharper corners
        sample_spacing: number | null = null,
    ): Polyline {
        return new Polyline(
            resample_line_points(
                this.verticies,
                smoothness_angle,
                sample_spacing,
            ),
        );
    }

    resample_strict(sample_spacing: number | null = null): Polyline {
        return resample_strict(this, sample_spacing);
    }

    remove_dubplicates(): Polyline {
        return remove_dub(this);
    }

    reverse(): Polyline {
        return new Polyline([...this.verticies].reverse());
    }
}
