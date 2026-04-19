import { Vector } from "..";
import { EPS } from "../../numerics";
import { closest_vectors, Geometry } from "../geometry";
import { Shape } from "../shape/shape";

export function intersections(g1: Geometry, g2: Geometry): Vector[] {
    if (g1 instanceof Shape) {
        return g1.intersection_positions(g2).map((p) => p.vec);
    }

    if (g2 instanceof Shape) {
        return g2.intersection_positions(g1).map((p) => p.vec);
    }

    const closest = closest_vectors(g1, g2)!;
    if (closest[0].distance(closest[1]) < EPS.tiny ** 2) {
        return [closest[0]];
    }

    return [];
}
