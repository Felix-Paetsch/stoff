import { Vector } from "../..";
import { Shape } from "../shape";

export function decode_intersection_positions(
    from: Float64Array,
): [Shape.ShapePosition, Shape.ShapePosition][] {
    const result: [Shape.ShapePosition, Shape.ShapePosition][] = [];

    // Each intersection is 6 floats: x, y, index_l1, frac_l1, index_l2, frac_l2
    for (let i = 0; i < from.length; i += 6) {
        const vec = new Vector(from[i]!, from[i + 1]!);
        const index_l1 = from[i + 2]!;
        const frac_l1 = from[i + 3]!;
        const index_l2 = from[i + 4]!;
        const frac_l2 = from[i + 5]!;

        const pos1: Shape.ShapePosition = {
            vec,
            index: Math.round(index_l1),
            frac: frac_l1,
        };

        const pos2: Shape.ShapePosition = {
            vec,
            index: Math.round(index_l2),
            frac: frac_l2,
        };

        result.push([pos1, pos2]);
    }

    return result;
}
