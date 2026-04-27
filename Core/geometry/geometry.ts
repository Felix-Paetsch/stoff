import { FiniteGeometry } from "./finite_geometry";
import { Line } from "./line";
import { Ray } from "./ray";
import { Shape } from "./shape/shape";
import { LineSegment } from "./types";
import { closest_vectors } from "./utils/closest_vector";
import { Vector } from "./vector";

export type Geometry = Vector | Line | Ray | LineSegment | Shape;

export { closest_vectors } from "./utils/closest_vector";

export function distance(g1: Geometry, g2: Geometry): number {
    const r = closest_vectors(g1, g2);
    if (!r) return Infinity;
    return r[0].distance(r[1]);
}

export function is_finite_geometry(g: Geometry): g is FiniteGeometry {
    return !(g instanceof Line || g instanceof Ray);
}

export { intersections } from "./utils/intersections";
