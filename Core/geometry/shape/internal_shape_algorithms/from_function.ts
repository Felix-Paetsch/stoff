import { Shape, Vector } from "../..";
import { CONF } from "../../../../config";
import { Bounds } from "../../../numerics/index";
import { Fraction } from "../../interval";

type FunctionSample = {
    at: Fraction;
    value: Vector;
};

export function vectors_from_polyline_function(
    fn: Shape.ShapeFunction,
    sample_spacing: number | null = null,
    start_samples: number = 2,
): Vector[] {
    const spacing = sample_spacing ?? CONF.DEFAULT_LINE_SEGMENT_LENGTH;

    const res: Vector[] = [fn(0)];
    let last_t = 0;

    const rest_samples: FunctionSample[] = [];
    for (let i = 1; i <= start_samples + 1; i++) {
        const at = i / (start_samples + 1);
        rest_samples.push({
            at,
            value: fn(at),
        });
    }

    let i = 0;
    while (rest_samples.length > 0 && ++i < Bounds.max_iterations) {
        if (rest_samples[0]!.value.distance(res[res.length - 1]!) < spacing) {
            const sample = rest_samples.shift()!;
            last_t = sample.at;
            res.push(sample.value);
            continue;
        }

        const test_t = (last_t + rest_samples[0]!.at) / 2;
        rest_samples.unshift({
            at: test_t,
            value: fn(test_t),
        });
    }

    if (i == Bounds.max_iterations) {
        throw new Error("Couldn't make polyline out of polyine fn!");
    }

    return res;
}
