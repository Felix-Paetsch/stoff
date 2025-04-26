/*
    Note this code was written using ChatGPT improving upon the old iteration.
*/

import {
    affine_transform_from_input_output,
    Vector,
    closest_vec_on_line_segment,
    EPS,
} from "../geometry.js";
import { copy_sketch_obj_data } from "../copy.js";
import { interpolate_colors } from "../colors.js";

export {
    intersect_lines,
    intersection_positions,
    plainLine_intersection_positions,
    _line_segments_intersect,
    _calculate_intersections,
};

function intersect_lines(sketch, line1, line2) {
    const intersections = _calculate_intersections(line1, line2);

    const int_color = interpolate_colors(
        line1.get_color(),
        line2.get_color(),
        0.5,
    );
    const l1_rel_points = line1.get_sample_points();
    for (let i = 0; i < intersections.length; i++) {
        intersections[i][4] = sketch
            .add_point(intersections[i][4])
            .set_color(int_color);
    }

    intersections.unshift([0, null, 0, null, line1.p1]);
    intersections.push([l1_rel_points.length - 2, null, 1, null, line1.p2]);

    const l1_segments = [];
    for (let i = 0; i < intersections.length - 1; i++) {
        const startIdx = intersections[i][0];
        const endIdx = intersections[i + 1][0] + 2;
        const sl_len = endIdx - startIdx;
        const rel_subslice = l1_rel_points.slice(startIdx, endIdx);
        const ifrac = intersections[i][2];
        const ifracNext = intersections[i + 1][2];
        const new_first_pt = rel_subslice[0]
            .mult(1 - ifrac)
            .add(rel_subslice[1].mult(ifrac));
        const new_last_pt = rel_subslice[sl_len - 2]
            .mult(1 - ifracNext)
            .add(rel_subslice[sl_len - 1].mult(ifracNext));
        rel_subslice[0] = new_first_pt;
        rel_subslice[sl_len - 1] = new_last_pt;

        const to_rel_fn = affine_transform_from_input_output(
            [new_first_pt, new_last_pt],
            [new Vector(0, 0), new Vector(1, 0)],
        );
        const sample_points = new Array(sl_len);
        for (let sp_i = 0; sp_i < sl_len; sp_i++) {
            sample_points[sp_i] = to_rel_fn(rel_subslice[sp_i]);
        }

        const l = sketch._line_between_points_from_sample_points(
            intersections[i][4],
            intersections[i + 1][4],
            sample_points,
        );
        copy_sketch_obj_data(line1, l);
        l1_segments.push(l);
    }

    const l2_rel_points = line2.get_sample_points();
    intersections[0] = [null, 0, null, 0, line2.p1];
    intersections[intersections.length - 1] = [
        null,
        l2_rel_points.length - 2,
        null,
        1,
        line2.p2,
    ];
    intersections.sort((a, b) => a[1] + a[3] - (b[1] + b[3]));

    const l2_segments = [];
    for (let i = 0; i < intersections.length - 1; i++) {
        const startIdx = intersections[i][1];
        const endIdx = intersections[i + 1][1] + 2;
        const sl_len = endIdx - startIdx;
        const rel_subslice = l2_rel_points.slice(startIdx, endIdx);
        const ifrac = intersections[i][3];
        const ifracNext = intersections[i + 1][3];
        const new_first_pt = rel_subslice[0]
            .mult(1 - ifrac)
            .add(rel_subslice[1].mult(ifrac));
        const new_last_pt = rel_subslice[sl_len - 2]
            .mult(1 - ifracNext)
            .add(rel_subslice[sl_len - 1].mult(ifracNext));
        rel_subslice[0] = new_first_pt;
        rel_subslice[sl_len - 1] = new_last_pt;

        const to_rel_fn = affine_transform_from_input_output(
            [new_first_pt, new_last_pt],
            [new Vector(0, 0), new Vector(1, 0)],
        );
        const sample_points = new Array(sl_len);
        for (let sp_i = 0; sp_i < sl_len; sp_i++) {
            sample_points[sp_i] = to_rel_fn(rel_subslice[sp_i]);
        }

        const l = sketch._line_between_points_from_sample_points(
            intersections[i][4],
            intersections[i + 1][4],
            sample_points,
        );
        copy_sketch_obj_data(line2, l);
        l2_segments.push(l);
    }

    intersections.pop();
    intersections.shift();
    intersections.sort((a, b) => a[0] + a[2] - (b[0] + b[2]));

    sketch.remove_line(line1);
    sketch.remove_line(line2);

    const resPoints = new Array(intersections.length);
    for (let i = 0; i < intersections.length; i++) {
        resPoints[i] = intersections[i][4];
    }

    return {
        intersection_points: resPoints,
        l1_segments,
        l2_segments,
    };
}

function intersection_positions(line1, line2) {
    const intersections = _calculate_intersections(line1, line2);
    const arr = new Array(intersections.length);
    for (let i = 0; i < intersections.length; i++) {
        arr[i] = intersections[i][4];
    }
    return arr;
}

function plainLine_intersection_positions(
    line,
    plainLine,
    fineness = EPS.MODERATE,
) {
    const abs = line.get_absolute_sample_points();
    const intp = [];

    for (let i = 0; i < abs.length - 1; i++) {
        const res = plainLine.intersect([abs[i], abs[i + 1]], fineness);
        if (res) {
            intp.push(res);
        }
    }

    const res_intp = [];

    outerLoop: for (let i = 0; i < intp.length; i++) {
        for (let j = 0; j < res_intp.length; j++) {
            if (res_intp[j].distance(intp[i]) < fineness) {
                continue outerLoop;
            }
        }
        res_intp.push(intp[i]);
    }

    return res_intp;
}

function _calculate_intersections(line1, line2, filter = true) {
    const l2_to_abs = affine_transform_from_input_output(
        [new Vector(0, 0), new Vector(1, 0)],
        [line2.p1, line2.p2],
    );
    const abs_to_l1 = affine_transform_from_input_output(
        [line1.p1, line1.p2],
        [new Vector(0, 0), new Vector(1, 0)],
    );
    const l2_to_l1 = (v) => abs_to_l1(l2_to_abs(v));

    const l1sp = line1.copy_sample_points();
    const cordsL1 = new Array(l1sp.length);
    for (let i = 0; i < l1sp.length; i++) {
        cordsL1[i] = [l1sp[i], i];
    }

    const l2sp = line2.get_sample_points();
    const cordsL2 = new Array(l2sp.length);
    for (let i = 0; i < l2sp.length; i++) {
        cordsL2[i] = [l2_to_l1(l2sp[i]), i];
    }

    const L1_monotone_segments = _get_monotone_segments(cordsL1);
    const L2_monotone_segments = _get_monotone_segments(cordsL2);

    let intersection_positions = [];
    for (let i = 0; i < L1_monotone_segments.length; i++) {
        for (let j = 0; j < L2_monotone_segments.length; j++) {
            const ip = _find_monotone_intersection_positions(
                L1_monotone_segments[i],
                L2_monotone_segments[j],
            );
            if (ip.length > 0) {
                intersection_positions = intersection_positions.concat(ip);
            }
        }
    }

    const cleaned_ip = _clean_intersection_positions(
        intersection_positions,
        line1,
    );
    if (!filter) return cleaned_ip;
    return _filter_intersection_positions(cleaned_ip, line1, line2);
}

function _clean_intersection_positions(intersection_positions, line1) {
    const l1_to_abs = affine_transform_from_input_output(
        [new Vector(0, 0), new Vector(1, 0)],
        [line1.p1, line1.p2],
    );

    const l1_rel_points = line1.get_sample_points();
    const cleaned_ip = [];
    for (let i = 0; i < intersection_positions.length; i++) {
        const current_entry = intersection_positions[i];
        if (current_entry[1] < current_entry[0]) {
            current_entry[0] = current_entry[1];
            current_entry[4] = 1 - current_entry[4];
        }
        if (current_entry[3] < current_entry[2]) {
            current_entry[2] = current_entry[3];
            current_entry[5] = 1 - current_entry[5];
        }
        const p0 = l1_rel_points[current_entry[0]];
        const p1 = l1_rel_points[current_entry[0] + 1];
        const rel_position = p0
            .mult(1 - current_entry[4])
            .add(p1.mult(current_entry[4]));
        cleaned_ip.push([
            current_entry[0],
            current_entry[2],
            current_entry[4],
            current_entry[5],
            l1_to_abs(rel_position),
        ]);
    }
    return cleaned_ip;
}

function _filter_intersection_positions(cleaned_ip, line1, line2) {
    cleaned_ip.sort((a, b) => a[1] + a[3] - (b[1] + b[3]));
    // insert start and end
    cleaned_ip.unshift([null, 0, null, 0, line2.p1]);
    cleaned_ip.push([null, Infinity, null, 0, line2.p2]);

    const filtered_ip0 = [];
    for (let i = 0; i < cleaned_ip.length; i++) {
        const ip = cleaned_ip[i];
        if (filtered_ip0.length > 0) {
            const dist = filtered_ip0[filtered_ip0.length - 1][4].distance(
                ip[4],
            );
            if (dist < EPS.LOOSE) continue;
        }
        filtered_ip0.push(ip);
    }

    filtered_ip0[0] = [0, null, 0, null, line1.p1];
    filtered_ip0[filtered_ip0.length - 1] = [Infinity, null, 0, null, line1.p2];
    filtered_ip0.sort((a, b) => a[0] + a[2] - (b[0] + b[2]));

    const filtered_ip = [];
    for (let i = 0; i < filtered_ip0.length; i++) {
        const ip = filtered_ip0[i];
        if (filtered_ip.length > 0) {
            const dist = filtered_ip[filtered_ip.length - 1][4].distance(ip[4]);
            if (dist < EPS.LOOSE) continue;
        }
        filtered_ip.push(ip);
    }

    filtered_ip.shift();
    filtered_ip.pop();
    return filtered_ip;
}

function _line_segments_intersect(start1, end1, start2, end2) {
    const d_start1_end1 = start1.distance(end1);
    const d_start2_end2 = start2.distance(end2);

    const denominator =
        (end2.y - start2.y) * (end1.x - start1.x) -
        (end2.x - start2.x) * (end1.y - start1.y);

    if (d_start1_end1 < EPS.MODERATE) {
        if (d_start2_end2 < EPS.MODERATE) {
            const d_s1_s2 = start1.distance(start2);
            const d_s1_e2 = start1.distance(end2);
            const d_e1_s2 = end1.distance(start2);
            const d_e1_e2 = end1.distance(end2);
            if (d_s1_s2 < EPS.MODERATE) return [true, 0, 0];
            if (d_s1_e2 < EPS.MODERATE) return [true, 0, 1];
            if (d_e1_s2 < EPS.MODERATE) return [true, 1, 0];
            if (d_e1_e2 < EPS.MODERATE) return [true, 1, 1];
            return [false];
        }

        const closest_start = closest_vec_on_line_segment(
            [start2, end2],
            start1,
        );
        const closest_end = closest_vec_on_line_segment([start2, end2], end1);
        if (start1.distance(closest_start) < EPS.MODERATE) {
            return [true, 0, start2.distance(closest_start) / d_start2_end2];
        }
        if (end1.distance(closest_end) < EPS.MODERATE) {
            return [true, 1, start2.distance(closest_end) / d_start2_end2];
        }
        return [false];
    } else if (d_start2_end2 < EPS.MODERATE) {
        const closest_start = closest_vec_on_line_segment(
            [start1, end1],
            start2,
        );
        const closest_end = closest_vec_on_line_segment([start1, end1], end2);
        const d_s1e1 = d_start1_end1;
        if (start2.distance(closest_start) < EPS.MODERATE) {
            return [true, start1.distance(closest_start) / d_s1e1, 0];
        }
        if (end2.distance(closest_end) < EPS.MODERATE) {
            return [true, start1.distance(closest_end) / d_s1e1, 0];
        }
        return [false];
    }

    if (Math.abs(denominator) < EPS.FINE) {
        const normalize = affine_transform_from_input_output(
            [start1, end1],
            [new Vector(0, 0), new Vector(1, 0)],
        );
        const s2_normal = normalize(start2);
        if (Math.abs(s2_normal.y) > EPS.MODERATE) return [false];
        const e2_normal = normalize(end2);
        if (
            (-EPS.MODERATE > s2_normal.x && -EPS.MODERATE > e2_normal.x) ||
            (1 + EPS.MODERATE < s2_normal.x && 1 + EPS.MODERATE < e2_normal.x)
        ) {
            return [false];
        }

        const x_arr = [0, 1, s2_normal.x, e2_normal.x];
        x_arr.sort((x, y) => x - y);
        const relX_slice = (x_arr[1] + x_arr[2]) * 0.5;

        const d_s1_e1 = d_start1_end1;
        const abs_intersection_pos = start1
            .mult(1 - relX_slice)
            .add(end1.mult(relX_slice));
        const d_s2_e2 = d_start2_end2;
        const dist_s2 = start2.distance(abs_intersection_pos);
        let relY_slice = 0;
        if (d_s2_e2 > EPS.MODERATE) relY_slice = dist_s2 / d_s2_e2;
        return [true, relX_slice, relY_slice];
    }

    const ua =
        ((end2.x - start2.x) * (start1.y - start2.y) -
            (end2.y - start2.y) * (start1.x - start2.x)) /
        denominator;
    const ub =
        ((end1.x - start1.x) * (start1.y - start2.y) -
            (end1.y - start1.y) * (start1.x - start2.x)) /
        denominator;

    if (
        ua < -EPS.MODERATE ||
        ua > 1 + EPS.MODERATE ||
        ub < -EPS.MODERATE ||
        ub > 1 + EPS.MODERATE
    ) {
        return [false];
    }

    return [true, ua, ub];
}

function _find_monotone_intersection_positions(s1, s2) {
    const ip = [];
    let s1_index = 0;
    let s2_index = 0;
    while (s1_index < s1.length - 1 && s2_index < s2.length - 1) {
        const s1_sx = s1[s1_index][0].x;
        const s1_ex = s1[s1_index + 1][0].x;
        const s2_sx = s2[s2_index][0].x;
        const s2_ex = s2[s2_index + 1][0].x;

        if (s1_ex + EPS.MODERATE < s2_sx) {
            s1_index++;
            continue;
        } else if (s2_ex + EPS.MODERATE < s1_sx) {
            s2_index++;
            continue;
        } else {
            const intersection_res = _line_segments_intersect(
                s1[s1_index][0],
                s1[s1_index + 1][0],
                s2[s2_index][0],
                s2[s2_index + 1][0],
            );
            if (intersection_res[0]) {
                ip.push([
                    s1[s1_index][1],
                    s1[s1_index + 1][1],
                    s2[s2_index][1],
                    s2[s2_index + 1][1],
                    Math.min(
                        1 - EPS.MODERATE_SQUARED,
                        Math.max(intersection_res[1], EPS.MODERATE_SQUARED),
                    ),
                    Math.min(
                        1 - EPS.MODERATE_SQUARED,
                        Math.max(intersection_res[2], EPS.MODERATE_SQUARED),
                    ),
                ]);
            }

            if (s2_ex - s1_ex < 0) {
                s2_index++;
                continue;
            }
            s1_index++;
        }
    }
    return ip;
}

function _get_monotone_segments(coords) {
    if (coords.length === 0) return [];
    const segments = [];
    let start = 0;
    let current_direction = 1;
    let last_x = coords[0][0].x;

    for (let i = 1; i < coords.length; i++) {
        const dx = coords[i][0].x - last_x;
        if (dx * current_direction <= 0) {
            segments.push(coords.slice(start, i));
            start = i - 1;
            current_direction *= -1;
        }
        last_x = coords[i][0].x;
    }
    segments.push(coords.slice(start));

    for (let i = 1; i < segments.length; i += 2) {
        segments[i].reverse();
    }

    return segments;
}
