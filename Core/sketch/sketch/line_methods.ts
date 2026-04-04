import {
    Vector,
    affine_transform_from_input_output,
    UP,
    Radians,
    Length,
    EPS,
} from "../../geometry";
import { Line } from "../line";
import { Point } from "../point";
import { Sketch } from "./index";
import { expect } from "../../expect";
import { same_sketch } from "../expect_methods/exports";
import {
    CopySketchObjectDataCallback,
    default_data_callback,
} from "../collection/copy";
import { is_polygon, Shape, to_shape } from "../../geometry/shapes/polyline";
import { interpolate_shapes } from "../../../ShapeManipulation/interpolate";
import { merge_shapes } from "@/Core/geometry/shapes/unstructured/merge";

export function line_between_points(pt1: Point, pt2: Point) {
    expect(same_sketch(pt1, pt2));
    const l = Line.straight(pt1, pt2);
    return l;
}

export function line_at_angle(
    point: Point,
    angle: Radians,
    length: Length,
    reference_direction: Vector = UP,
    absolute: boolean = false, // Whether the direction is pointed from 0 or towards this point
) {
    if (absolute) {
        reference_direction = reference_direction.subtract(point);
    }

    const vec = reference_direction.to_len(length).rotate(angle);
    const new_pt = point.get_sketch().add_point(point.add(vec));
    const line = line_between_points(point, new_pt);

    return {
        line,
        other_endpoint: new_pt,
    };
}

export type NumberFunction = (t: number) => number;
export type TwoNumberFunction = (t: number) => [number, number];

export function line_between_points_from_shape(
    pt1: Point,
    pt2: Point,
    shape: Shape,
) {
    if (is_polygon(shape)) {
        const offset = pt1.subtract(shape.root());

        return new Line(
            [pt1, pt2],
            shape.map((v) => v.add(offset)),
        );
    }

    const map_fun = affine_transform_from_input_output(
        [shape.first(), shape.last()],
        [pt1, pt2],
    );

    const l = new Line([pt1, pt2], shape.map(map_fun));
    return l;
}

export function interpolate_lines(
    line1: Line,
    line2: Line,
    f: NumberFunction = (x) => x,
    p1: NumberFunction = (x) => x,
    p2: NumberFunction = (x) => x,
) {
    expect(same_sketch(line1, line2));

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

    const pt1 = [line1, line2][line_1_index]?.get_endpoints()[p_1_index];
    const pt2 = [line1, line2][line_2_index]?.get_endpoints()[p_2_index];

    if (!pt1 || !pt2) {
        throw new Error("Interpolation ends aren't endpoints");
    }

    expect(pt1.equals(new_shape_fn(0), EPS.FINE));
    expect(pt2.equals(new_shape_fn(1), EPS.FINE));

    return new Line([pt1, pt2], to_shape(new_shape_fn));
}

export function copy_line(l: Line, p1: Point, p2: Point) {
    const line = new Line([p1, p2], l.shape);

    line.data = { ...l.data };

    return line;
}

export function merge_lines(
    sketch: Sketch,
    line1: Line,
    line2: Line,
    delete_join: boolean = false,
    data_callback: CopySketchObjectDataCallback = default_data_callback,
) {
    expect(same_sketch(line1, line2, sketch));

    let new_endpoints: [Point, Point];
    let handedness = line1.right_handed;
    if (line1.p2 == line2.p1) {
        new_endpoints = [line1.p1, line2.p2];
    } else if (line1.p1 == line2.p2) {
        new_endpoints = [line2.p1, line1.p2];
    } else if (line1.p1 == line2.p1) {
        handedness = !handedness;
        new_endpoints = [line1.p2, line2.p2];
    } else if (line1.p2 == line2.p1) {
        new_endpoints = [line1.p1, line2.p1];
    } else {
        throw new Error("Lines have no endpoint in common");
    }

    const shape = merge_shapes(line1.shape, line2.shape);
    const new_line = sketch.line_between_points_from_shape(
        new_endpoints[0],
        new_endpoints[1],
        shape,
    );

    new_line.set_handedness(handedness);
    new_line.data = data_callback(line1.data, line2.data, line1, line2);

    if (delete_join) {
        sketch.remove(line1.p2);
    } else {
        sketch.remove(line1);
        sketch.remove(line2);
    }

    return new_line;
}

/*
export function point_on_line(
    sketch: Sketch,
    pt: Point,
    line: Line,
): {
    line_segments: [Line, Line];
    point: Point;
} {
    if (!(pt instanceof Point)) {
        pt = sketch.add_point(pt);
    }
    const abs = line.get_absolute_sample_points();

    let closest_line_segment_first_index = 0;
    let closest_distance = Infinity;
    for (let i = 0; i < abs.length - 1; i++) {
        const new_dist = distance_from_line_segment([abs[i]!, abs[i + 1]!], pt);
        if (closest_distance > new_dist) {
            closest_distance = new_dist;
            closest_line_segment_first_index = i;
        }
    }

    if (closest_distance > 0.1) {
        throw new Error("Point not actually on line!");
    }

    const line_vector = abs[closest_line_segment_first_index + 1]!.subtract(
        abs[closest_line_segment_first_index]!,
    );
    const offset_vector = line_vector.get_orthonormal().scale(closest_distance);

    const splitting_pt = pt.subtract(offset_vector);

    const left_part = abs.slice(0, closest_line_segment_first_index + 1);
    const right_part = abs.slice(closest_line_segment_first_index + 1);

    left_part.push(splitting_pt);
    right_part.unshift(splitting_pt);

    const left_to_rel_fun = affine_transform_from_input_output(
        [line.p1, splitting_pt],
        [new Vector(0, 0), new Vector(1, 0)],
    );

    const right_to_rel_fun = affine_transform_from_input_output(
        [splitting_pt, line.p2],
        [new Vector(0, 0), new Vector(1, 0)],
    );

    const line_segments: [Line, Line] = [
        sketch._line_between_points_from_sample_points(
            line.p1,
            pt,
            left_part.map(left_to_rel_fun),
        ),
        sketch._line_between_points_from_sample_points(
            pt,
            line.p2,
            right_part.map(right_to_rel_fun),
        ),
    ];

    line_segments.forEach((ls) => {
        ls.data = {
            ...line.data,
        };
        ls.set_handedness(line.right_handed);
    });
    sketch.remove(line);

    return {
        line_segments: line_segments,
        point: pt,
    };
}

export function split_line_at_length(
    sketch: Sketch,
    line: Line,
    length: number,
    reversed: boolean = false,
) {
    expect(same_sketch(line, sketch));
    const position = line.position_at_length(length, reversed);
    const pt = sketch.add_point(position);
    return sketch.point_on_line(pt, line);
}

export function split_line_at_fraction(
    sketch: Sketch,
    line: Line,
    fraction: number,
    reversed = false,
) {
    const position = line.position_at_fraction(fraction, reversed);
    const pt = sketch.add_point(position);
    return sketch.point_on_line(pt, line);
}

export function intersect_lines(
    sketch: Sketch,
    line1: Line,
    line2: Line,
): {
    intersection_points: Point[];
    l1_segments: Line[];
    l2_segments: Line[];
} {
    expect(same_sketch(line1, line2, sketch));

    return UnicornIntersect.intersect_lines(sketch, line1, line2);
}

export function line_with_offset(
    sketch: Sketch,
    line: Line,
    offset: number,
    withHandedness: boolean = true,
) {
    const abs_sample_points = line.offset_sample_points(offset, withHandedness);
    const p1 = sketch.add_point(abs_sample_points[0]!);
    const p2 = sketch.add_point(
        abs_sample_points[abs_sample_points.length - 1]!,
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
}

export function intersection_positions(
    sketch: Sketch,
    line1: Line | PlainLine | Ray,
    line2: Line | PlainLine | Ray,
): Vector[] {
    if (line1 instanceof Line && line2 instanceof Line) {
        expect(same_sketch(sketch, line1, line2));
        return UnicornIntersect.intersection_positions(line1, line2);
    }

    if (!(line1 instanceof Line) && !(line2 instanceof Line)) {
        const pos = line1.intersect(line2);
        if (pos) return [pos];
        return [];
    }

    if (line1 instanceof PlainLine || line1 instanceof Ray) {
        return intersection_positions(sketch, line2, line1);
    }

    expect(same_sketch(sketch, line1));
    return UnicornIntersect.plainLine_intersection_positions(
        line1,
        line2 as PlainLine | Ray,
    );
}
*/
