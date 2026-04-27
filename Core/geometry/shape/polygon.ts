import { Bounds } from "Core/numerics";
import { area, contains, contains_properly } from "Core/rust/exports";
import {
    centroid,
    coordinate_position,
    interior_point,
    winding,
} from "Core/rust/pkg/stoff_rust";
import * as FiniteGeometry from "../finite_geometry";
import { Radians } from "../types";
import { as_polyline } from "../utils/misc";
import { Vector } from "../vector";
import { vectors_from_polyline_function } from "./algorithms/from_function";
import { remove_dub } from "./algorithms/remove_dub";
import { resample_polygon_points_smooth } from "./algorithms/resample_smooth";
import { resample_strict } from "./algorithms/resample_strict";
import { Polyline } from "./polyline";
import { Shape } from "./shape";

export class Polygon extends Shape {
    // A polygon has the last line segment implicit. However a duplicate point doesn't matter.
    constructor(positions: Float64Array | Vector[]) {
        super(positions);
    }

    to_polyline() {
        const l = this.positions.length;

        if (this.positions.length < 2) {
            return new Polyline(this.positions);
        }

        const newArray = new Float64Array(l + 2);
        newArray.set(this.positions);
        newArray[l] = this.positions[0]!;
        newArray[l + 1] = this.positions[1]!;

        return new Polyline(newArray);
    }

    is_polygon(): true {
        return true;
    }

    is_polyline(): false {
        return false;
    }

    static from_vectors(vec: Vector[]): Polygon {
        const length = vec.length * 2;
        const positions = new Float64Array(length);

        let idx = 0;
        // Fill from loops, calculations, etc.
        for (const vertex of vec) {
            positions[idx++] = vertex.x;
            positions[idx++] = vertex.y;
        }

        return new Polygon(positions);
    }

    map(
        fn: (vec: Vector, len_rel: number, len_abs: number) => Vector,
    ): Polygon {
        const res: Vector[] = [];

        const ver = this.vertices;
        const l = this.length();
        let current_l = 0;

        for (let i = 0; i < ver.length; i++) {
            res.push(fn(ver[i]!, current_l / l, current_l));
        }

        return Polygon.from_vectors(res);
    }

    root(): Vector | null {
        return this.vertices.length > 0 ? this.vertices[0]! : null;
    }

    static override from_function(fn: Shape.PolylineFunction): Polygon {
        const vectors = vectors_from_polyline_function(fn);
        // First use polyine to get rid of potential duplicate point at the end
        return new Polyline(vectors).as_polygon();
    }

    resample_smooth(
        smoothness_angle: Radians = Math.PI * 1.2, // Low angle leads to smoothing even around sharper corners
        sample_spacing: number | null = null,
    ): Polygon {
        return new Polygon(
            resample_polygon_points_smooth(
                this.vertices,
                smoothness_angle,
                sample_spacing,
            ),
        );
    }

    resample(sample_spacing: number | null = null): Polygon {
        return resample_strict(this, sample_spacing);
    }

    remove_dubplicates(): Polygon {
        return remove_dub(this);
    }

    move_root(to: Shape.ShapePositionDescriptor): Polygon {
        if (this.is_empty()) return this;

        const to_shape_position =
            this.shape_point_descriptor_to_shape_position(to);
        if (!to_shape_position) return this;

        let res: Vector[] = [to_shape_position.vec].concat(
            this.vertices.slice(to_shape_position.index + 1),
        );
        res = res.concat(this.vertices.slice(0, to_shape_position.index + 1));
        return new Polygon(res);
    }

    contains(what: FiniteGeometry.FiniteGeometry): boolean {
        if (this.is_empty()) return false;
        let other: Shape = as_polyline(what);

        return contains(this.positions, other.positions);
    }

    contains_properly(what: FiniteGeometry.FiniteGeometry): boolean {
        if (this.is_empty()) return false;
        let other: Shape = as_polyline(what);

        return contains_properly(this.positions, other.positions);
    }

    area(): number {
        if (this.vertex_count < 3) {
            return 0;
        }
        return area(this.positions);
    }

    interior_point(): Vector | null {
        const ip = interior_point(this.positions);
        if (!ip) return null;

        return new Vector(ip[0]!, ip[1]!);
    }

    centroid(): Vector | null {
        const ip = centroid(this.positions);
        if (!ip) return null;

        return new Vector(ip[0]!, ip[1]!);
    }

    coordinate_position(v: Vector): "outside" | "inside" | "on_boundary" {
        if (this.is_empty()) return "outside";
        const pos = coordinate_position(this.positions, v.x, v.y);
        if (pos == -1) return "outside";
        if (pos == 0) return "inside";
        return "on_boundary";
    }

    orientation(): "cw" | "ccw" | "none" {
        const res = winding(this.positions);
        if (res == 0) return "none";
        if (res == 1) return "cw";
        return "ccw";
    }

    is_cw() {
        return this.orientation() == "cw";
    }

    is_ccw() {
        return this.orientation() == "ccw";
    }

    reverse(): Polygon {
        if (this.is_empty()) return this;
        const vert: Vector[] = this.vertices.slice(1).reverse();
        return new Polygon([this.root() as Vector].concat(vert));
    }

    slice(
        from: Shape.ShapePositionDescriptor,
        to: Shape.ShapePositionDescriptor,
    ): Polyline {
        if (this.vertex_count == 0) return new Polyline([]);

        const sp1 = this.shape_point_descriptor_to_shape_position(from);
        const sp2 = this.shape_point_descriptor_to_shape_position(to);

        if (!sp1 || !sp2) return new Polyline([]);

        let res: Vector[] = [sp1.vec];

        const guard = Bounds.guard_inf_loop(this.vertex_count + 2);

        for (
            let i = sp1.index + 1;
            i != sp2.index + 1;
            i = (i + 1) % this.vertex_count
        ) {
            guard();
            res.push(this.vertices[i]!);
        }

        res.push(sp2.vec);

        return Polyline.from_vectors(res);
    }

    static override empty() {
        return new Polygon([]);
    }

    as_polyline(): Polyline {
        return this.to_polyline();
    }

    as_polygon(): Polygon {
        return this;
    }
}
