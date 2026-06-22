import { Validate } from "@/Dev";

import { CONF } from "@/Core/config";
import { Expect } from "@/Core/expect";
import { interpolate_shapes, InterpolationFunctions } from "@/Core/geometry";
import { EPS } from "@/Core/numerics";
import { Line, Point } from "@/Core/sketch";

export type NumberFunction = (t: number) => number;
export type TwoNumberFunction = (t: number) => [number, number];

export function interpolate_lines(
    line1: Line,
    line2: Line,
    interpolation_fn:
        | null
        | NumberFunction
        | Partial<InterpolationFunctions> = null,
    sample_spacing: number = CONF.DEFAULT_LINE_SEGMENT_LENGTH,
) {
    Expect.that(Validate.same_sketch(line1, line2));

    const new_shape = interpolate_shapes(
        line1.shape,
        line2.shape,
        interpolation_fn,
        sample_spacing,
    );

    let endpoints: [Point, Point];
    if (interpolation_fn == null || typeof interpolation_fn == "function") {
        endpoints = [line1.p1, line2.p2];
    } else {
        const { f, p1, p2 } = interpolation_fn;

        const p1_line_index = f ? Math.round(f(0)) : 0;
        const p1_ep_index = p1 ? Math.round(p1(0)) : 0;

        const p2_line_index = f ? Math.round(f(1)) : 1;
        const p2_ep_index = p2 ? Math.round(p2(1)) : 1;

        const pt1 = [line1, line2][p1_line_index]?.endpoints()[p1_ep_index];
        const pt2 = [line1, line2][p2_line_index]?.endpoints()[p2_ep_index];

        Expect.that(!(!pt1 || !pt2), "Interpolation ends aren't endpoints");
        endpoints = [pt1!, pt2!];
    }

    Expect.that(endpoints[0].vec.distance(new_shape.first()!) < EPS.tiny);
    Expect.that(endpoints[1].vec.distance(new_shape.last()!) < EPS.tiny);

    return new Line(endpoints, new_shape);
}
