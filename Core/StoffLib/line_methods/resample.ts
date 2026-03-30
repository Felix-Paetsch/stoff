import CONF from "../config.json" with { type: "json" };
import { Spline } from "../curves";
import { EPS, vec_angle, Vector } from "../geometry";
import { radians } from "../geometry/types";
import { Line } from "../line";

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

export function resample_line_points2(
    line: Line,
    sample_spacing: number | null = null,
    smoothness_angle: radians = Math.PI * 1.2, // Low angle leads to smoothing even around sharper corners
): Vector[] {
    const sp = line.sample_points;
    const res: Vector[] = [sp[0]!];

    if (sample_spacing == null) {
        sample_spacing = CONF.DEFAULT_LINE_SEGMENT_LENGTH;
    }

    const rel_sample_spacing = sample_spacing! / line.endpoint_distance();

    let current_left_index = 0;
    let distance_to_next_res_pt = rel_sample_spacing;
    let distance_to_next_sample_pt = sp[1]!.distance(sp[0]!);
    let current_spline: null | ((x: number) => Vector) = null;

    while (true) {
        if (distance_to_next_sample_pt < distance_to_next_res_pt) {
            distance_to_next_res_pt -= distance_to_next_sample_pt;

            current_left_index += 1;
            if (current_left_index == sp.length - 1) {
                break;
            }

            // If its a corner
            const curr = sp[current_left_index]!;
            const prev = sp[current_left_index - 1]!;
            const next = sp[current_left_index + 1]!;
            if (
                curr.distance(prev) > EPS.TINY &&
                curr.distance(next) > EPS.TINY &&
                vec_angle(prev, next, curr) < smoothness_angle
            ) {
                res.push(curr);
            }

            distance_to_next_sample_pt = sp[current_left_index]!.distance(
                sp[current_left_index + 1]!,
            );
            current_spline = null;
            continue;
        }

        if (!current_spline) {
            current_spline = spline_for_line_segment(
                sp[current_left_index - 1] || null,
                sp[current_left_index]!,
                sp[current_left_index + 1]!,
                sp[current_left_index + 2] || null,
                smoothness_angle,
            );
        }

        distance_to_next_sample_pt -= distance_to_next_res_pt;
        distance_to_next_res_pt = rel_sample_spacing;

        const total_line_segment_length = sp[current_left_index]!.distance(
            sp[current_left_index + 1]!,
        );
        const fraction =
            1 - distance_to_next_res_pt / total_line_segment_length;
        res.push(current_spline(fraction));
    }

    res.push(sp[sp.length - 1]!);

    if (
        sp[sp.length - 1]!.subtract(res[res.length - 1]!).length() <
        rel_sample_spacing * 0.3
    ) {
        res.pop();
    }

    return res;
}
