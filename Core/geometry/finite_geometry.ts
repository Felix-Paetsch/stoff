import { LineSegment } from "./types";
import { Shape } from "./shape/shape";
import { Polygon } from "./shape/polygon";
import { Vector } from "./vector";
import { BoundingBox } from "./bounding_box";
import { as_polyline, merge_float_arrays } from "./geometry/utils";
import { convex_hull as convex_hull_rust } from "../rust/exports";

export type FiniteGeometry = Vector | LineSegment | Shape;

export function bounding_box(...geometries: FiniteGeometry[]) {
    return BoundingBox.merge(
        geometries.map((g) => {
            if (g instanceof Vector) return new BoundingBox(g.x, g.y, g.x, g.y);
            if (g instanceof Shape) {
                return BoundingBox.from_points(g.verticies);
            }
            return BoundingBox.from_points(g);
        }),
    );
}

export function convex_hull(...geometries: FiniteGeometry[]): null | Polygon {
    const positions = merge_float_arrays(
        geometries.map((g) => as_polyline(g)).map((g) => g.positions),
    ).reverse();
    const gon = convex_hull_rust(positions);
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
