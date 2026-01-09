import {
    Vector,
    affine_transform_from_input_output,
    UP,
    distance_from_line_segment,
    PlainLine,
    Ray,
} from "../geometry.js";
import Line from "../line";
import Point from "../point";
import Sketch from "../sketch";
import assert from "../../assert.js";
import { interpolate_colors } from "../colors.js";
import CONF from "../config.json" with { type: "json" };
import { same_sketch } from "../assert_methods/exports.js";
import { length, radians } from "../geometry/types.js";
import { copy_data_callback, copy_sketch_obj_data, CopySketchDataCallback, default_data_callback } from "../copy.js";
import SketchElementCollection from "../sketch_element_collection.js";
import * as UnicornIntersect from "../unicorns/intersect_lines.js";

export function line_between_points(
    sketch: Sketch,
    pt1: Point,
    pt2: Point
) {
    [pt1, pt2].forEach((p) => {
        assert(same_sketch(p, sketch));
    });

    const l = Line.straight(pt1, pt2);
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
export type TwoNumberFunction = (t: number) => [number, number];

export function line_from_function_graph(
    sketch: Sketch,
    pt1: Point,
    pt2: Point,
    f_1: NumberFunction | TwoNumberFunction
) {
    let f: (t: number) => [number, number];

    if (typeof f_1(1) == "number") {
        f = (t) => [t, f_1(t) as number];
    } else {
        f = f_1 as TwoNumberFunction;
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
        assert(same_sketch(p, sketch));
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
        assert(same_sketch(l, sketch));
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

export function copy_line(l: Line, p1: Point, p2: Point) {
    return new Line([p1, p2], l.get_sample_points())
}


export function merge_lines(
    sketch: Sketch,
    line1: Line,
    line2: Line,
    delete_join: boolean = false,
    data_callback: CopySketchDataCallback = default_data_callback
) {
    assert(same_sketch(line1, line2, sketch));

    const [old_p1, old_p2] = line1.get_endpoints();
    if (
        (line1.p2 == line2.p1 && line1.p1 == line2.p2) ||
        (line1.p1 == line2.p1 && line1.p2 == line2.p2)
    ) {
        throw new Error("Can't merge lines with both endpoints in common.");
    } else if (line1.p1 == line2.p1) {
        line1.swap_orientation();
    } else if (line1.p2 == line2.p2) {
        line2.swap_orientation();
    } else if (line1.p1 == line2.p2) {
        line1.swap_orientation();
        line2.swap_orientation();
    } else if (line1.p2 != line2.p1) {
        throw new Error("Lines have no endpoint in common");
    }

    const abs1 = line1.get_absolute_sample_points();
    const abs2 = line2.get_absolute_sample_points();
    abs1.pop();
    const abs_total = abs1.concat(abs2);

    const t_fun = affine_transform_from_input_output(
        [line1.p1, line2.p2],
        [new Vector(0, 0), new Vector(1, 0)]
    );

    const relative_points = abs_total.map((p) => t_fun(p));
    const new_line = sketch._line_between_points_from_sample_points(
        line1.p1,
        line2.p2,
        relative_points
    );

    new_line.set_color(
        interpolate_colors(line1.get_color(), line2.get_color(), 0.5)
    );
    new_line.set_handedness(line1.right_handed);
    new_line.data = data_callback(line1.data, line2.data, line1, line2);

    if (delete_join) {
        sketch.remove_point(line1.p2);
    } else {
        sketch.remove_line(line1);
        sketch.remove_line(line2);
    }

    // Make sure we take orientation from line 1
    if (new_line.p1 == old_p2 || new_line.p2 == old_p1) {
        new_line.swap_orientation();
    }
    return new_line;
};


export function point_on_line(
    sketch: Sketch,
    pt: Point,
    line: Line,
    data_callback: CopySketchDataCallback = copy_data_callback
) {
    if (!(pt instanceof Point)) {
        pt = sketch.add_point(pt);
    }
    const abs = line.get_absolute_sample_points();

    let closest_line_segment_first_index = 0;
    let closest_distance = Infinity;
    for (let i = 0; i < abs.length - 1; i++) {
        const new_dist = distance_from_line_segment(
            [abs[i], abs[i + 1]],
            pt
        );
        if (closest_distance > new_dist) {
            closest_distance = new_dist;
            closest_line_segment_first_index = i;
        }
    }

    if (closest_distance > 0.1) {
        throw new Error("Point not actually on line!");
    }

    const line_vector = abs[closest_line_segment_first_index + 1].subtract(
        abs[closest_line_segment_first_index]
    );
    const offset_vector = line_vector
        .get_orthonormal()
        .scale(closest_distance);

    const splitting_pt = pt.subtract(offset_vector);

    const left_part = abs.slice(0, closest_line_segment_first_index + 1);
    const right_part = abs.slice(closest_line_segment_first_index + 1);

    left_part.push(splitting_pt);
    right_part.unshift(splitting_pt);

    const left_to_rel_fun = affine_transform_from_input_output(
        [line.p1, splitting_pt],
        [new Vector(0, 0), new Vector(1, 0)]
    );

    const right_to_rel_fun = affine_transform_from_input_output(
        [splitting_pt, line.p2],
        [new Vector(0, 0), new Vector(1, 0)]
    );

    const line_segments = [
        sketch._line_between_points_from_sample_points(
            line.p1,
            pt,
            left_part.map(left_to_rel_fun)
        ),
        sketch._line_between_points_from_sample_points(
            pt,
            line.p2,
            right_part.map(right_to_rel_fun)
        ),
    ];

    line_segments.forEach((ls) => {
        copy_sketch_obj_data(line, ls, data_callback);
        ls.set_handedness(line.right_handed);
    });
    sketch.remove_line(line);

    return {
        line_segments: new SketchElementCollection(line_segments),
        point: pt,
    }
};


export function split_line_at_length(
    sketch: Sketch,
    line: Line,
    length: number,
    data_callback: CopySketchDataCallback = copy_data_callback,
    reversed: boolean = false
) {
    assert(same_sketch(line, sketch));
    const position = line.position_at_length(length, reversed);
    const pt = sketch.add_point(position);
    return sketch.point_on_line(pt, line, data_callback);
};


export function split_line_at_fraction(
    sketch: Sketch,
    line: Line,
    fraction: number,
    data_callback: CopySketchDataCallback = copy_data_callback,
    reversed = false,
) {
    const position = line.position_at_fraction(fraction, reversed);
    const pt = sketch.add_point(position);
    return sketch.point_on_line(pt, line, data_callback);
};

export function intersect_lines(sketch: Sketch, line1: Line, line2: Line): {
    intersection_points: Point[],
    l1_segments: Line[],
    l2_segments: Line[]
} {
    assert(same_sketch(line1, line2, sketch));

    const { intersection_points, l1_segments, l2_segments } =
        UnicornIntersect.intersect_lines(sketch, line1, line2);

    return {
        intersection_points: new SketchElementCollection(intersection_points),
        l1_segments: new SketchElementCollection(l1_segments),
        l2_segments: new SketchElementCollection(l2_segments),
    }
};

export function line_with_offset(
    sketch: Sketch,
    line: Line,
    offset: number,
    withHandedness: boolean = true,
) {
    const abs_sample_points = line.offset_sample_points(
        offset,
        withHandedness,
    );
    const p1 = sketch.add_point(abs_sample_points[0]);
    const p2 = sketch.add_point(
        abs_sample_points[abs_sample_points.length - 1],
    );

    const ret_line = sketch._line_between_points_from_sample_points(
        p1,
        p2,
        abs_sample_points,
    );
    ret_line.set_handedness(line.right_handed);
    return {
        p1,
        p2,
        line: ret_line,
    };
};

export function intersection_positions(
    sketch: Sketch,
    line1: Line | PlainLine | Ray,
    line2: Line | PlainLine | Ray
): Vector[] {
    if (line1 instanceof Line && line2 instanceof Line) {
        assert(same_sketch(sketch, line1, line2));
        return UnicornIntersect.intersection_positions(line1, line2);
    }

    if (
        !(line1 instanceof Line) && !(line2 instanceof Line)
    ) {
        const pos = line1.intersect(line2);
        if (pos) return [pos];
        return [];
    }

    if (line1 instanceof PlainLine || line1 instanceof Ray) {
        return intersection_positions(sketch, line2, line1);
    }

    assert(same_sketch(sketch, line1));
    return UnicornIntersect.plainLine_intersection_positions(line1, line2 as PlainLine | Ray);
};
