import {
    wasm_geometry_concave_hull_geometries,
    wasm_geometry_concave_hull_shape,
    wasm_geometry_concave_hull_vertices,
    wasm_geometry_convex_hull,
    WASMCompatability,
} from "Rust/exports";
import { BoundingBox } from "./bounding_box";
import { Polygon } from "./shape/polygon";
import { Shape } from "./shape/shape";
import { LineSegment } from "./types";
import { as_polyline } from "./utils/misc";
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

export function convex_hull(geometries: FiniteGeometry[]): Polygon {
    const positions = WASMCompatability.Geometry.vertex_vec_to_vecf64(
        geometries.map((g) => as_polyline(g)).flatMap((g) => g.vertices),
    );

    const gon = wasm_geometry_convex_hull(positions)!;
    return new Polygon(gon);
}

export type ConcaveHullOptions = {
    concavity: number;
    length_threshold: number;
};
export function concave_hull(
    geometries: FiniteGeometry[],
    options: Partial<ConcaveHullOptions> = {},
): Polygon {
    const concavity = options.concavity ? Math.max(options.concavity, 0.01) : 2;
    const length_threshold = options.length_threshold
        ? Math.max(options.length_threshold, 0)
        : 0;

    if (geometries.length == 0) {
        return Polygon.empty();
    }

    if (geometries.every((g) => g instanceof Vector)) {
        const input = WASMCompatability.Geometry.vertex_vec_to_vecf64(
            geometries as Vector[],
        );
        const hull = wasm_geometry_concave_hull_vertices(
            input,
            concavity,
            length_threshold,
        )!;
        const result = WASMCompatability.Geometry.vecf64_to_geometry(hull);
        return result as Polygon;
    }

    if (geometries.length == 1) {
        const input = WASMCompatability.Geometry.geometry_to_vecf64(
            as_polyline(geometries[0]!),
        );
        const hull = wasm_geometry_concave_hull_shape(
            input,
            concavity,
            length_threshold,
        )!;
        const result = WASMCompatability.Geometry.vecf64_to_geometry(hull);
        return result as Polygon;
    }

    const input = WASMCompatability.Geometry.geometry_vec_to_vecf64(
        geometries.map(as_polyline),
    );
    const hull = wasm_geometry_concave_hull_geometries(
        input,
        concavity,
        length_threshold,
    )!;
    const result = WASMCompatability.Geometry.vecf64_to_geometry(hull);
    return result as Polygon;
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
        const adjusted_t = t * 2 * Math.PI;
        return new Vector(
            radius * Math.sin(adjusted_t),
            radius * Math.cos(adjusted_t),
        ).add(center);
    });
}
