import {
    concave_hull as concave_hull_rust,
    convex_hull as convex_hull_rust,
} from "../rust/exports";
import { BoundingBox } from "./bounding_box";
import { as_polyline, merge_float_arrays } from "./geometry/utils";
import { Polygon } from "./shape/polygon";
import { Shape } from "./shape/shape";
import { LineSegment } from "./types";
import { Vector } from "./vector";

export type FiniteGeometry = Vector | LineSegment | Shape;

export function bounding_box(geometries: FiniteGeometry[]) {
    return BoundingBox.merge(
        geometries.map((g) => {
            if (g instanceof Vector) return new BoundingBox(g.x, g.y, g.x, g.y);
            if (g instanceof Shape) {
                return BoundingBox.from_vectors(g.vertices);
            }
            return BoundingBox.from_vectors(g);
        }),
    );
}

export function convex_hull(geometries: FiniteGeometry[]): null | Polygon {
    const positions = merge_float_arrays(
        geometries.map((g) => as_polyline(g)).map((g) => g.positions),
    );
    const gon = convex_hull_rust(positions);
    if (!gon) return null;
    return new Polygon(gon);
}

export type ConcaveHullOptions = {
    concavity: number;
    length_threshold: number;
};
export function concave_hull(
    geometries: FiniteGeometry[],
    options: Partial<ConcaveHullOptions> = {},
): null | Polygon {
    const positions = merge_float_arrays(
        geometries.map((g) => as_polyline(g)).map((g) => g.positions),
    );

    const concavity = options.concavity ? Math.max(options.concavity, 0.01) : 2;
    const length_threshold = options.length_threshold
        ? Math.max(options.length_threshold, 0)
        : 0;
    const gon = concave_hull_rust(positions, concavity, length_threshold);

    if (!gon) return null;
    return new Polygon(gon);
}

export function rectangle(v1: Vector, v2: Vector): Polygon {
    return new Polygon([
        v1,
        new Vector(v2.x, v1.y),
        v2,
        new Vector(v1.x, v2.y),
    ]);
}

export function circle(center: Vector, radius: number): Polygon {
    return Polygon.from_function((t) => {
        return new Vector(radius * Math.sin(t), radius * Math.cos(t)).add(
            center,
        );
    });
}
