import { Fraction, LengthMap, Polyline, Shape, Vector } from "@/Core/geometry";
import { CONF } from "Core/config";
import { Expect } from "Core/expect";

export type NumberFunction = (t: Fraction) => Fraction;
export type InterpolationFunctions = {
    f: NumberFunction;
    p1: NumberFunction;
    p2: NumberFunction;
};

export function interpolate_shapes(
    line1: Shape.Shape,
    line2: Shape.Shape,
    interpolation_fn:
        | null
        | NumberFunction
        | Partial<InterpolationFunctions> = null,
    sample_spacing: number = CONF.DEFAULT_LINE_SEGMENT_LENGTH,
): Polyline {
    Expect.that(
        !line1.is_empty() && !line2.is_empty(),
        "Provided Lines are empty..",
    );

    if (interpolation_fn === null) {
        interpolation_fn = (x: number) => x;
    }

    if (typeof interpolation_fn == "function") {
        return interpolate_shapes_linear(
            line1,
            line2,
            interpolation_fn,
            sample_spacing,
        );
    }

    const f = interpolation_fn.f || ((x: number) => x);
    const p1 = interpolation_fn.p1 || ((x: number) => x);
    const p2 = interpolation_fn.p2 || ((x: number) => x);

    const shfun = (t: number) => {
        return Vector.lerp(line1.sample(p1(t))!, line2.sample(p2(t))!, f(t));
    };
    return Polyline.from_function(shfun);
}

function interpolate_shapes_linear(
    line1: Shape.Shape,
    line2: Shape.Shape,
    interpolation_function: NumberFunction | null = null,
    sample_spacing: number,
): Polyline {
    const f = interpolation_function || ((x: number) => x);
    sample_spacing = sample_spacing || CONF.DEFAULT_LINE_SEGMENT_LENGTH;

    const m1 = line1.length_map_ref();
    const m2 = line2.length_map_ref();

    const pos_acc_1 = LengthMap.get_position_monotone(m1);
    const pos_acc_2 = LengthMap.get_position_monotone(m2);

    const len1 = line1.length();
    const len2 = line2.length();
    const max_len = Math.max(len1, len2);
    const steps = Math.ceil(max_len / sample_spacing);

    const res: Vector[] = [];
    for (let i = 0; i <= steps; i++) {
        const frac = i / steps;

        const pos1 = pos_acc_1(frac * len1);
        const pos2 = pos_acc_2(frac * len2);
        const v1 = line1.vector_at(pos1)!;
        const v2 = line2.vector_at(pos2)!;

        res.push(Vector.lerp(v1, v2, f(frac)));
    }

    return new Polyline(res);
}
