import { EPS, eps_equal } from "./eps";
import { triangle_data } from "./triangle_data";
import {
    Vector,
    Matrix,
    Ray,
    Line,
    ZERO,
    UP,
    DOWN,
    LEFT,
    RIGHT,
    VERTICAL,
    HORIZONTAL,
} from "./classes";
import {
    affine_transform_from_input_output,
    orthogonal_transform_from_input_output,
    closest_vec_on_line_segment,
    distance_from_line_segment,
    convex_hull,
    is_convex,
    deg_to_rad,
    rad_to_deg,
    vec_angle,
    vec_angle_clockwise,
    rotation_fun,
    line_segments_intersect,
    polygon_contains_point,
    orientation,
    polygon_orientation,
} from "./algorithms";

import { BoundingBox } from "./bounding_box";
import { merge_intervals, interval_overlap, Interval, Fraction } from "./1d";
import {
    isLineSegment,
    LineSegment,
    MirrorData,
    Radians,
    Degrees,
    Length,
} from "./types";

export function mirror_type(el: Line | Ray | LineSegment): "Line";
export function mirror_type(el: Vector | null): "Point";
export function mirror_type(el: MirrorData): "Line" | "Point";
export function mirror_type(el: MirrorData): "Line" | "Point" {
    if (el instanceof Line || el instanceof Ray || isLineSegment(el))
        return "Line";
    return "Point";
}

export {
    Vector,
    Matrix,
    affine_transform_from_input_output,
    orthogonal_transform_from_input_output,
    closest_vec_on_line_segment,
    distance_from_line_segment,
    convex_hull,
    is_convex,
    deg_to_rad,
    rad_to_deg,
    vec_angle,
    vec_angle_clockwise,
    rotation_fun,
    triangle_data,
    line_segments_intersect,
    polygon_contains_point,
    orientation,
    polygon_orientation,
    ZERO,
    UP,
    DOWN,
    LEFT,
    RIGHT,
    VERTICAL,
    HORIZONTAL,
    Line as PlainLine,
    Ray,
    EPS,
    eps_equal,
    BoundingBox,
    merge_intervals,
    interval_overlap,
    type Radians,
    type Degrees,
    type Length,
    type Interval,
    type Fraction,
    type MirrorData,
};
