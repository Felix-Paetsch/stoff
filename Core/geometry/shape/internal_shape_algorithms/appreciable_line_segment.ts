// Sometimes line segments are just too short. This function returns a best line
// segment which has sufficient length. If there is a very small turn here
// however there can still be problems, or if the line is too short.

import { Shape, Vector } from "../..";
import { EPS } from "../../../numerics";
import { LineSegment } from "../../types";
import { Polygon } from "../polygon";
import { Polyline } from "../polyline";

export function get_appreciable_line_segment(
    s: Polygon | Polyline,
    line_segment_index: number,
): LineSegment | null {
    if (s.is_empty()) {
        return null;
    }

    const shape = s;
    let left = line_segment_index % shape.linesegment_count();
    if (left < 0) {
        left += shape.linesegment_count();
    }
    let right = left + 1;

    let max_iterations_left = shape.linesegment_count();

    let vert_left = shape.vertex_at(left)!;
    let vert_right = shape.vertex_at(right)!;

    if (!vert_left.approx_equals(vert_right)) {
        return [vert_left, vert_right];
    }

    const center = Vector.lerp(vert_left, vert_right, 0.5);

    while (max_iterations_left > 0 && vert_left.approx_equals(center)) {
        const prev = prev_index(shape, left);
        if (prev !== null) {
            left = prev;
            max_iterations_left -= 1;
            vert_left = shape.vertex_at(left)!;
        } else {
            break;
        }
    }

    while (max_iterations_left > 0 && vert_right.approx_equals(center)) {
        const next = next_index(shape, right);
        if (next !== null) {
            right = next;
            max_iterations_left -= 1;
            vert_right = shape.vertex_at(right)!;
        } else {
            break;
        }
    }

    const res_left = center.approx_equals(vert_left)
        ? vert_left
        : Vector.lerp_abs(center, vert_left, EPS.tiny);

    const res_right = center.approx_equals(vert_right)
        ? vert_right
        : Vector.lerp_abs(center, vert_right, EPS.tiny);

    return [res_left, res_right];
}

export function get_appreciable_corner(
    s: Polygon | Polyline,
    at: number,
): [[Vector, Vector], [Vector, Vector]] | null {
    if (s.is_empty()) {
        return null;
    }

    const shape = s;

    let left = prev_index(shape, at);
    let right = next_index(shape, at);

    if (left === null || right === null) {
        return null;
    }

    const center = shape.vertex_at(at)!;
    let vert_left = shape.vertex_at(left)!;
    let vert_right = shape.vertex_at(right)!;

    if (!vert_left.approx_equals(center) && !vert_right.approx_equals(center)) {
        return [
            [vert_left, center],
            [center, vert_right],
        ];
    }

    let max_iterations_left = shape.vertex_count();

    while (max_iterations_left > 0 && vert_left.approx_equals(center)) {
        const prev = prev_index(shape, left);
        if (prev !== null) {
            left = prev;
            max_iterations_left -= 1;
            vert_left = shape.vertex_at(left)!;
        } else {
            break;
        }
    }

    while (max_iterations_left > 0 && vert_right.approx_equals(center)) {
        const next = next_index(shape, right);
        if (next !== null) {
            right = next;
            max_iterations_left -= 1;
            vert_right = shape.vertex_at(right)!;
        } else {
            break;
        }
    }

    const res_left = center.approx_equals(vert_left)
        ? vert_left
        : Vector.lerp_abs(center, vert_left, EPS.tiny);

    const res_right = center.approx_equals(vert_right)
        ? vert_right
        : Vector.lerp_abs(center, vert_right, EPS.tiny);

    return [
        [res_left, center],
        [center, res_right],
    ];
}

function next_index(s: Shape.Shape, current_index: number): number | null {
    if (current_index + 1 < s.vertex_count()) {
        return current_index + 1;
    } else if (s instanceof Polygon) {
        return 0;
    } else {
        return null;
    }
}

function prev_index(s: Shape.Shape, current_index: number): number | null {
    if (current_index > 0) {
        return current_index - 1;
    } else if (s instanceof Polygon) {
        return s.vertex_count() - 1;
    } else {
        return null;
    }
}
