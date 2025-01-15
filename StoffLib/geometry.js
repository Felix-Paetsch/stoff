import EPS from "./geometry/eps.js";
import triangle_data from "./geometry/triangle_data.js";
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
    HORIZONTAL
} from "./geometry/classes.js";
import {
    affine_transform_from_input_output,
    orthogonal_transform_from_input_output,
    closest_vec_on_line_segment,
    distance_from_line_segment,
    convex_hull,
    bounding_box,
    deg_to_rad,
    rad_to_deg,
    vec_angle,
    vec_angle_clockwise,
    rotation_fun,
    line_segments_intersect,
    polygon_contains_point
} from "./geometry/algorithms.js";

function mirror_type(el, vec2 = null){
    if (el instanceof Line) return "Line";
    if (el instanceof Array) return mirror_type(...el);
    if (vec2 instanceof Vector) return "Line";
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
    bounding_box,
    deg_to_rad,
    rad_to_deg,
    vec_angle,
    vec_angle_clockwise,
    rotation_fun,
    triangle_data,
    mirror_type,
    line_segments_intersect,
    polygon_contains_point,
    ZERO,
    UP,
    DOWN,
    LEFT,
    RIGHT,
    VERTICAL,
    HORIZONTAL,
    Line as PlainLine,
    Ray,
    EPS
};
