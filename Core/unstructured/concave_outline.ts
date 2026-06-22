import { FiniteGeometry, Polygon, Vector } from "@/Core/geometry";
import { vector_at_lattice_point } from "../grids/index";
import { BooleanGrid } from "../types";

const offsets: [number, number][] = [
    [-1, -1],
    [-1, 0],
    [-1, 1],
    [0, -1],
    [0, 1],
    [1, -1],
    [1, 0],
    [1, 1],
];

export function concave_outline(
    g: BooleanGrid,
    options?: Partial<FiniteGeometry.ConcaveHullOptions>,
): Polygon {
    const pts: Vector[] = [];
    const dim = g.dimensions_ref.lattice_dimensions;

    for (let i = 0; i < dim[0]; i++) {
        for (let j = 0; j < dim[1]; j++) {
            if (!g.value_at_lattice_point([i, j])) continue;

            if (
                i == 0 ||
                j == 0 ||
                i == dim[0] - 1 ||
                j == dim[0] - 1 ||
                offsets.some(
                    (o) => !g.value_at_lattice_point([i + o[0], j + o[1]]),
                )
            ) {
                pts.push(vector_at_lattice_point(g.dimensions(), [i, j]));
            }
        }
    }

    return FiniteGeometry.concave_hull(pts, options);
}
