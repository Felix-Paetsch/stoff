import { EPS, Radians, vec_angle, Vector } from "@/Core/geometry";
import CONF from "../../../../config.json" with { type: "json" };
import { Spline } from "../curves/splines";
import { PolygonVectors, PolylineVectors } from "../polyline";

// creates a spline which can be samples between p1 and p2 by a number from 0 to 1 interpolating p1 and p2
function spline_for_line_segment(
    p0: Vector | null,
    p1: Vector,
    p2: Vector,
    p3: Vector | null,
    smoothness_angle: number,
): (x: number) => Vector {
    if (p0 && vec_angle(p0, p2, p1) < smoothness_angle) {
        p0 = null;
    }
    if (p3 && vec_angle(p1, p3, p2) < smoothness_angle) {
        p3 = null;
    }

    if (p0 == null && p3 == null) {
        return (x) => Vector.lerp(p1, p2, x);
    }

    const t1 = p0 ? p1.subtract(p0) : p2.subtract(p1);
    const t2 = p3 ? p3.subtract(p2) : p2.subtract(p1);

    return Spline.hermite_spline([p1, p2], [t1, t2], true);
}

export function resample_line_points(
    line: PolylineVectors,
    sample_spacing: number | null = null,
    smoothness_angle: Radians = Math.PI * 1.2, // Low angle leads to smoothing even around sharper corners
): PolylineVectors {
    const res: Vector[] = [line[0]!];

    if (sample_spacing == null) {
        sample_spacing = CONF.DEFAULT_LINE_SEGMENT_LENGTH;
    }

    let current_left_index = 0;
    let distance_to_next_res_pt = sample_spacing;
    let distance_to_next_sample_pt = line[1]!.distance(line[0]!);
    let current_spline: null | ((x: number) => Vector) = null;

    while (true) {
        if (distance_to_next_sample_pt < distance_to_next_res_pt) {
            distance_to_next_res_pt -= distance_to_next_sample_pt;

            current_left_index += 1;
            if (current_left_index == line.length - 1) {
                break;
            }

            // If its a corner
            const curr = line[current_left_index]!;
            const prev = line[current_left_index - 1]!;
            const next = line[current_left_index + 1]!;
            if (
                curr.distance(prev) > EPS.TINY &&
                curr.distance(next) > EPS.TINY &&
                vec_angle(prev, next, curr) < smoothness_angle
            ) {
                res.push(curr);
            }

            distance_to_next_sample_pt = line[current_left_index]!.distance(
                line[current_left_index + 1]!,
            );
            current_spline = null;
            continue;
        }

        if (!current_spline) {
            current_spline = spline_for_line_segment(
                line[current_left_index - 1] || null,
                line[current_left_index]!,
                line[current_left_index + 1]!,
                line[current_left_index + 2] || null,
                smoothness_angle,
            );
        }

        distance_to_next_sample_pt -= distance_to_next_res_pt;
        distance_to_next_res_pt = sample_spacing;

        const total_line_segment_length = line[current_left_index]!.distance(
            line[current_left_index + 1]!,
        );
        const fraction =
            1 - distance_to_next_res_pt / total_line_segment_length;
        res.push(current_spline(fraction));
    }

    res.push(line[line.length - 1]!);

    if (
        line[line.length - 1]!.subtract(res[res.length - 1]!).length() <
        sample_spacing * 0.3
    ) {
        res.pop();
    }

    return res;
}

// This differes from the previous method in two ways:
// - for the first and last line we include the correct endpoints
// - we temporarily close the curve and then open it back up
export function resample_polygon_points(
    line: PolygonVectors,
    sample_spacing: number | null = null,
    smoothness_angle: Radians = Math.PI * 1.2, // Low angle leads to smoothing even around sharper corners
): PolygonVectors {
    const res: Vector[] = [line[0]!];
    line.push(line[0]!);

    if (sample_spacing == null) {
        sample_spacing = CONF.DEFAULT_LINE_SEGMENT_LENGTH;
    }

    let current_left_index = 0;
    let distance_to_next_res_pt = sample_spacing;
    let distance_to_next_sample_pt = line[1]!.distance(line[0]!);
    let current_spline: null | ((x: number) => Vector) = null;

    while (true) {
        if (distance_to_next_sample_pt < distance_to_next_res_pt) {
            distance_to_next_res_pt -= distance_to_next_sample_pt;

            current_left_index += 1;
            if (current_left_index == line.length - 1) {
                break;
            }

            // If its a corner
            const curr = line[current_left_index]!;
            const prev = line[current_left_index - 1]!;
            const next = line[current_left_index + 1]!;
            if (
                curr.distance(prev) > EPS.TINY &&
                curr.distance(next) > EPS.TINY &&
                vec_angle(prev, next, curr) < smoothness_angle
            ) {
                res.push(curr);
            }

            distance_to_next_sample_pt = line[current_left_index]!.distance(
                line[current_left_index + 1]!,
            );
            current_spline = null;
            continue;
        }

        if (!current_spline) {
            current_spline = spline_for_line_segment(
                line[current_left_index - 1] || line[line.length - 1]!,
                line[current_left_index]!,
                line[current_left_index + 1]!,
                line[current_left_index + 2] || line[0]!,
                smoothness_angle,
            );
        }

        distance_to_next_sample_pt -= distance_to_next_res_pt;
        distance_to_next_res_pt = sample_spacing;

        const total_line_segment_length = line[current_left_index]!.distance(
            line[current_left_index + 1]!,
        );
        const fraction =
            1 - distance_to_next_res_pt / total_line_segment_length;
        res.push(current_spline(fraction));
    }

    res.push(line[line.length - 1]!);

    if (
        line[line.length - 1]!.subtract(res[res.length - 1]!).length() <
        sample_spacing * 0.3
    ) {
        res.pop();
    }

    // Unclose the polygon
    res.pop();
    line.pop();

    return res;
}
