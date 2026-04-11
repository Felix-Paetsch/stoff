import {
    Vector,
    affine_transform_from_input_output,
    UP,
    Radians,
    Length,
    EPS,
} from "../../../geometrytry";
import { Line } from "../line";
import { Point } from "../point";
import { Sketch } from "./sketch";
import { expect } from "../../expect";
import { same_sketch } from "../../../todo/expect_methods/exports";
import {
    CopySketchObjectDataCallback,
    default_data_callback,
} from "../copy";
import { is_polygon, Shape, to_shape } from "../../../geometry_old/shapes/polylineine";
import { interpolate_shapes } from "../../../ShapeManipulation/interpolate";
import { merge_shapes } from "@/geometry_old/shapes/unstructured/mergee

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
