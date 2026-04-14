// Sometimes line segments are just to short. This function returns a best line segment which has sufficient length
// If there is a very small turn here however there can still be problems. Or if the line is to short

import { EPS } from "Core/numerics";
import { Shape, Vector } from "../..";
import { LineSegment } from "../../types";
import { Polygon } from "../polygon";
import { Polyline } from "../polyline";

export function get_appreciable_line_segment(
    s: Polygon | Polyline,
    line_segment_index: number,
): LineSegment | null {
    const verticies = s.as_polyline().verticies;
    if (line_segment_index > verticies.length - 2 || line_segment_index < 0)
        return null;

    let left_right: [number, number] = [
        line_segment_index,
        line_segment_index + 1,
    ];

    if (
        verticies[left_right[0]]!.distance(verticies[left_right[1]]!) > EPS.tiny
    ) {
        return [verticies[left_right[0]]!, verticies[left_right[1]]!];
    }

    const center = Vector.add(
        verticies[line_segment_index]!,
        verticies[line_segment_index + 1]!,
    ).scale(0.5);

    while (
        left_right[0] > 0 &&
        verticies[left_right[0]]!.distance(center) < EPS.tiny
    ) {
        left_right[0]--;
    }

    while (
        left_right[1] < verticies.length - 1 &&
        verticies[left_right[1]]!.distance(center) < EPS.tiny
    ) {
        left_right[1]++;
    }

    return [
        Vector.lerp_abs(center, verticies[left_right[0]]!, EPS.tiny),
        Vector.lerp_abs(center, verticies[left_right[1]]!, EPS.tiny),
    ];
}

export function get_appreciable_corner(
    s: Polygon | Polyline,
    at: number,
): null | [[Vector, Vector], [Vector, Vector]] {
    if (
        s.is_empty() ||
        next_index(s, at) === null ||
        prev_index(s, at) === null
    )
        return null;

    const verticies = s.verticies;
    const center = verticies[at]!;

    let left_right: [number, number] = [prev_index(s, at)!, next_index(s, at)!];

    if (
        verticies[left_right[0]]!.distance(center) > EPS.tiny &&
        verticies[left_right[1]]!.distance(center) > EPS.tiny
    ) {
        return [
            [verticies[left_right[0]]!, center],
            [center, verticies[left_right[1]]!],
        ];
    }

    while (
        verticies[left_right[0]]!.distance(center) < EPS.tiny &&
        left_right[0] !== at
    ) {
        let p = prev_index(s, at);
        if (!p) return null;
        left_right[0] = p;
    }

    while (
        verticies[left_right[1]]!.distance(center) < EPS.tiny &&
        left_right[1] !== at
    ) {
        let p = next_index(s, at);
        if (!p) return null;
        left_right[1] = p;
    }

    return [
        [verticies[left_right[0]]!, center],
        [center, verticies[left_right[1]]!],
    ];
}

function next_index(s: Shape.Shape, current_index: number): null | number {
    if (current_index < s.verticies.length - 1) {
        return current_index + 1;
    }
    if (s instanceof Polygon) {
        return 0;
    }
    return null;
}

function prev_index(s: Shape.Shape, current_index: number): null | number {
    if (current_index > 0) {
        return current_index - 1;
    }
    if (s instanceof Polygon) {
        return s.verticies.length - 1;
    }
    return null;
}
