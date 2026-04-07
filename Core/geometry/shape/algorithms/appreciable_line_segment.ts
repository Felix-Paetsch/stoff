// Sometimes line segments are just to short. This function returns a best line segment which has sufficient length
// If there is a very small turn here however there can still be problems. Or if the line is to short

import { EPS } from "@/Core/numerics";
import { LineSegment } from "../../types";
import { Polygon } from "../polygon";
import { Polyline } from "../polyline";
import { Vector } from "../..";

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
