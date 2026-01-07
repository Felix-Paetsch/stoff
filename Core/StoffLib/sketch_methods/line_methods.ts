import {
    Vector,
    affine_transform_from_input_output,
    UP,
} from "../geometry.js";
import Line from "../line";
import Point from "../point";
import assert from "../../assert.js";
import { interpolate_colors } from "../colors.js";
import line_with_length_fn from "../unicorns/line_with_length.js";
import CONF from "../config.json" with { type: "json" };
import { Sketch } from "../sketch";
import { has_sketch } from "../assert_methods/exports.js";
import { length, radians } from "../geometry/types.js";

export function line_between_points(
    sketch: Sketch,
    pt1: Point,
    pt2: Point
) {
    [pt1, pt2].forEach((p) => {
        assert(has_sketch(p, sketch));
    });

    const l = Line.straight(sketch, [pt1, pt2]);
    l.set_color(
        interpolate_colors(pt1.get_color(), pt2.get_color(), 0.5)
    );

    return l;
}

export function line_at_angle(
    sketch: Sketch,
    point: Point,
    angle: radians,
    length: length,
    reference_direction: Vector = UP,
    absolute: boolean = false // Whether the direction is pointed from 0 or towards this point
) {
    if (absolute) {
        reference_direction = reference_direction.subtract(point);
    }

    const vec = reference_direction.to_len(length).rotate(angle);
    const new_pt = sketch.add_point(point.add(vec));
    const line = line_between_points(sketch, point, new_pt);

    return {
        line,
        other_endpoint: new_pt,
    };
}

export type NumberFunction = (t: number) => number;

export function line_from_function_graph(
    sketch: Sketch,
    pt1: Point,
    pt2: Point,
    f_1: NumberFunction,
    f_2: NumberFunction | null = null
) {
    let f: (t: number) => [number, number];

    if (f_2 == null) {
        f = (t) => [t, f_1(t)];
    } else {
        f = (t) => [f_1(t), f_2(t)];
    }

    const n = Math.ceil(1 / sketch.sample_density);

    const sample_points = Array.from(
        { length: n + 1 },
        (_, i) => new Vector(...f(i / n))
    );

    const transform = affine_transform_from_input_output(
        [sample_points[0], sample_points[sample_points.length - 1]],
        [new Vector(0, 0), new Vector(1, 0)]
    );

    return _line_between_points_from_sample_points(
        sketch,
        pt1,
        pt2,
        sample_points.map(transform)
    );
}

export function _line_between_points_from_sample_points(
    sketch: Sketch,
    pt1: Point,
    pt2: Point,
    sp: Vector[]
) {
    [pt1, pt2].forEach((p) => {
        assert(has_sketch(p, sketch));
    });

    const to_rel_fun = affine_transform_from_input_output(
        [sp[0], sp[sp.length - 1]],
        [new Vector(0, 0), new Vector(1, 0)]
    );

    const l = new Line([pt1, pt2], sp.map(to_rel_fun));
    return l;
}

export function interpolate_lines(
    sketch: Sketch,
    line1: Line,
    line2: Line,
    direction: 0 | 1 | 2 | 3 = 0,
    f: NumberFunction = (x) => x,
    p1: NumberFunction = (x) => x,
    p2: NumberFunction = (x) => x
) {
    [line1, line2].forEach((l) => {
        assert(has_sketch(l, sketch));
    });

    function normalize_fun(g: NumberFunction): NumberFunction {
        const g0 = g(0);
        const g1 = g(1);
        if (g0 === g1) {
            throw new Error("Interpolation Function has equal endpoints");
        }
        const a = 1 / (g1 - g0);
        const b = -a * g0;
        return (x) => a * g(x) + b;
    }

    const f_norm = normalize_fun(f);
    const p1_norm = normalize_fun(p1);
    const p2_norm = normalize_fun(p2);

    let flippedLine1 = false;
    let flippedLine2 = false;

    if (direction === 1 || direction === 3) {
        line1.swap_orientation();
        flippedLine1 = true;
    }
    if (direction === 2 || direction === 3) {
        line2.swap_orientation();
        flippedLine2 = true;
    }

    const [endpoint_L11] = line1.get_endpoints();
    const [, endpoint_L22] = line2.get_endpoints();

    const start = endpoint_L11;
    const end = endpoint_L22;

    const abs_to_rel = affine_transform_from_input_output(
        [start, end],
        [new Vector(0, 0), new Vector(1, 0)]
    );

    const n = Math.ceil(1 / sketch.sample_density);
    const k = Math.ceil(1 / CONF.INTERPOLATION_NORMALIZATION_DENSITY);

    const line1_normalized = (line1 as any)._abs_normalized_sample_points(k);
    const line2_normalized = (line2 as any)._abs_normalized_sample_points(k);

    function interpolateFromNormalized(samples: Vector[], position: number) {
        const index = position * (samples.length - 1);
        const i0 = Math.floor(index);
        const i1 = Math.min(i0 + 1, samples.length - 1);
        const f = index - i0;

        const s0 = samples[i0];
        const s1 = samples[i1];

        return new Vector(
            s0.x * (1 - f) + s1.x * f,
            s0.y * (1 - f) + s1.y * f
        );
    }

    const sample_points = new Array(n + 1);

    for (let i = 0; i <= n; i++) {
        const t = i / n;

        const L1 = abs_to_rel(
            interpolateFromNormalized(line1_normalized, p1_norm(t))
        );
        const L2 = abs_to_rel(
            interpolateFromNormalized(line2_normalized, p2_norm(t))
        );

        const ft = f_norm(t);

        sample_points[i] = new Vector(
            L1.x * (1 - ft) + L2.x * ft,
            L1.y * (1 - ft) + L2.y * ft
        );
    }

    const new_line = _line_between_points_from_sample_points(
        sketch,
        start,
        end,
        sample_points
    );

    new_line.set_handedness(line1.right_handed);

    if (flippedLine1) line1.swap_orientation();
    if (flippedLine2) line2.swap_orientation();

    return new_line;
}
