import {
    wasm_geometry_buffer_geometries_with_style,
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
import { as_polyline, as_shape } from "./utils/misc";
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

export type BufferLineJoinStyle =
    | "bevel"
    | "miter"
    | "round"
    | ["miter", number]
    | ["round", number];
export type BufferLineCapStyle =
    | "butt"
    | "round"
    | "square"
    | ["round", number];

export function buffer(
    what: FiniteGeometry[],
    distance: number,
    joinstyle: BufferLineJoinStyle = "round",
    capstyle: BufferLineCapStyle = "round",
) {
    const shapes = what.map((s) => as_shape(s));

    const f64 = WASMCompatability.Geometry.geometry_vec_to_vecf64(
        shapes as Shape.Shape[],
    );

    const [line_join_number, line_join_value] =
        bufferLineJoinStyle_to_number(joinstyle);
    const [line_cap_number, line_cap_value] =
        bufferLineCapStyle_to_number(capstyle);

    const buffer_res = wasm_geometry_buffer_geometries_with_style(
        f64,
        distance,
        line_join_number,
        line_join_value,
        line_cap_number,
        line_cap_value,
    )!;
    const res = WASMCompatability.Geometry.vecf64_to_geometry_vec(buffer_res);
    return res as Polygon[];
}

function bufferLineJoinStyle_to_number(
    b: BufferLineJoinStyle,
): [number, number] {
    if (b == "bevel") {
        return [1, NaN];
    }

    if (b == "round") {
        b = ["round", 0.2];
    }

    if (b == "miter") {
        b = ["miter", 1];
    }

    return [b[0] == "miter" ? 2 : 0, b[1]];
}

function bufferLineCapStyle_to_number(b: BufferLineCapStyle): [number, number] {
    if (b == "butt") {
        return [1, NaN];
    }

    if (b == "square") {
        return [2, NaN];
    }

    if (b == "round") {
        b = ["round", 0.2];
    }

    return [0, b[1]];
}
