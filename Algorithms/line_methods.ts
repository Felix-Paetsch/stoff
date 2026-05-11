import { EPS, Expect, Line, Shape } from "@/Core";
import { Validate } from "@/Dev";
import { interpolate_shapes } from "Algorithms/interpolate";

export type NumberFunction = (t: number) => number;
export type TwoNumberFunction = (t: number) => [number, number];
export function interpolate_lines(
    line1: Line,
    line2: Line,
    f: NumberFunction = (x) => x,
    p1: NumberFunction = (x) => x,
    p2: NumberFunction = (x) => x,
) {
    Expect.that(Validate.same_sketch(line1, line2));

    const new_shape_fn = interpolate_shapes(
        line1.shape,
        line2.shape,
        f,
        p1,
        p2,
    );

    const line_1_index = Math.round(f(0));
    const p_1_index = Math.round(p1(0));
    const line_2_index = Math.round(f(1));
    const p_2_index = Math.round(p1(1));

    const pt1 = [line1, line2][line_1_index]?.endpoints()[p_1_index];
    const pt2 = [line1, line2][line_2_index]?.endpoints()[p_2_index];

    if (!pt1 || !pt2) {
        throw new Error("Interpolation ends aren't endpoints");
    }

    Expect.that(pt1.vec.distance(new_shape_fn(0)) < EPS.tiny);
    Expect.that(pt2.vec.distance(new_shape_fn(1)) < EPS.tiny);

    return new Line([pt1, pt2], Shape.from_function(new_shape_fn));
}
