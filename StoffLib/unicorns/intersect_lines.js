import { affine_transform_from_input_output, Vector, closest_vec_on_line_segment } from "../geometry.js";
import { copy_sketch_obj_data } from '../copy.js';
import { interpolate_colors } from '../colors.js';

const EPSILON = 0.000001;
const EPSILON2 = EPSILON * EPSILON;

export {
    intersect_lines,
    intersection_positions,
    _line_segments_intersect,
    _calculate_intersections
}

function intersect_lines(sketch, line1, line2){
    /*
        Problems:
        a) We currently have one
        b) Two sample points at same position
    */


    /*
        returns: {
            intersection_points: [],
            l1_segments: [],
            l2_segments: []
        }

        Note, that this function deletes line1 and line 2 and replaces them.
    */

    const intersections = _calculate_intersections(line1, line2); // Sorted by line1

    const int_color = interpolate_colors(line1.get_color(), line2.get_color(), 0.5);
    const l1_rel_points = line1.get_sample_points();

    intersections.forEach(
        (int) => {
            int[4] = sketch.add_point(int[4]).set_color(int_color);
        }
    );

    // Handle Line 1
    intersections.unshift([0,null,0,null,line1.p1]);
    intersections.push([l1_rel_points.length - 2,null,1,null,line1.p2]);

    const l1_segments = [];
    for (let i = 0; i < intersections.length - 1; i++) {
        const sl_len = intersections[i+1][0] - intersections[i][0] + 2;

        const rel_subslice = l1_rel_points.slice(
            intersections[i][0],
            intersections[i+1][0] + 2
        );

        const new_first_pt = rel_subslice[0].mult(1 - intersections[i][2]).add(rel_subslice[1].mult(intersections[i][2]));
        const new_last_pt = rel_subslice[sl_len - 2].mult(1 - intersections[i + 1][2])
                            .add(rel_subslice[sl_len - 1].mult(intersections[i + 1][2]));

        rel_subslice[0] = new_first_pt;
        rel_subslice[sl_len - 1] = new_last_pt;

        const to_rel_fn = affine_transform_from_input_output(
            [new_first_pt, new_last_pt],
            [new Vector(0,0), new Vector(1, 0)]
        );

        const sample_points = rel_subslice.map(v => to_rel_fn(v));

        const l = sketch._line_between_points_from_sample_points(
            intersections[i][4],
            intersections[i+1][4],
            sample_points
        );
        copy_sketch_obj_data(line1, l);
        l1_segments.push(l);
    }

    // Handle Line 2
    const l2_rel_points = line2.get_sample_points();


    intersections[0] = [null,0,null,0,line2.p1];
    intersections[intersections.length - 1] = [null, l2_rel_points.length - 2, null, 1, line2.p2];
    intersections.sort((a,b) => a[1] + a[3] - b[1] - b[3]);

    const l2_segments = [];
    for (let i = 0; i < intersections.length - 1; i++) {
        const sl_len = intersections[i+1][1] - intersections[i][1] + 2;
        const rel_subslice = l2_rel_points.slice(
            intersections[i][1],
            intersections[i+1][1] + 2
        );

        const new_first_pt = rel_subslice[0].mult(1 - intersections[i][3]).add(rel_subslice[1].mult(intersections[i][3]));
        const new_last_pt = rel_subslice[sl_len - 2].mult(1 - intersections[i + 1][3])
                            .add(rel_subslice[sl_len-1].mult(intersections[i + 1][3]));

        rel_subslice[0] = new_first_pt;
        rel_subslice[sl_len - 1] = new_last_pt;

        const to_rel_fn = affine_transform_from_input_output(
            [new_first_pt, new_last_pt],
            [new Vector(0,0), new Vector(1, 0)]
        );

        const sample_points = rel_subslice.map(v => to_rel_fn(v));
        const l = sketch._line_between_points_from_sample_points(
            intersections[i][4],
            intersections[i+1][4],
            sample_points
        );
        copy_sketch_obj_data(line2, l);
        l2_segments.push(l);
    }

    // Continuing

    intersections.pop();
    intersections.shift();
    intersections.sort((a,b) => a[0] + a[2] - b[0] - b[2]);

    sketch.remove_line(line1);
    sketch.remove_line(line2);

    return {
        intersection_points: intersections.map(p => p[4]),
        l1_segments,
        l2_segments
    }
}

function intersection_positions(line1, line2){
    const intersections = _calculate_intersections(line1, line2);
    return intersections.map(p => p[4]);
}

function _calculate_intersections(line1, line2, filter = true){
    /*
        returns: [vec]

        This algorithm works by splitting each line into monotone sequences in coordinates
            startpoint->endpoint direction of the first line
        and then comparing if they intersect. The interesction points will be in order by how they lie on line1.
    */

    const l2_to_abs = affine_transform_from_input_output(
        [new Vector(0,0), new Vector(1,0)],
        [line2.p1,  line2.p2]
    );
    const abs_to_l1  = affine_transform_from_input_output(
        [line1.p1,  line1.p2],
        [new Vector(0,0), new Vector(1,0)]
    );
    const l2_to_l1 = (v) => {
        return abs_to_l1(l2_to_abs(v));
    };

    
    // In line1 coordinates
    const cordsL1 = line1.copy_sample_points().map((v, i) => [v, i]);
    const cordsL2 = line2.get_sample_points().map((v, i) => [l2_to_l1(v), i]);

    const L1_monotone_segments = _get_monotone_segments(cordsL1);
    const L2_monotone_segments = _get_monotone_segments(cordsL2);

    const intersection_positions = [];

    for (let i = 0; i < L1_monotone_segments.length; i++){
        for (let j = 0; j < L2_monotone_segments.length; j++){
            intersection_positions.push(..._find_monotone_intersection_positions(
                L1_monotone_segments[i], L2_monotone_segments[j]
            ));
        }
    }
    
    const cleaned_ip = _clean_intersection_positions(intersection_positions, line1);
    if (!filter) return cleaned_ip;
    const filtered = _filter_intersection_positions(cleaned_ip, line1, line2);
    return filtered;
}

function _clean_intersection_positions(intersection_positions, line1){
    // [from1, to1, from2, to2, distance1, distance2, abs_position]
    const l1_to_abs = affine_transform_from_input_output(
        [new Vector(0,0), new Vector(1,0)],
        [line1.p1,  line1.p2]
    );

    const l1_rel_points = line1.get_sample_points();
    const cleaned_ip = [];

    intersection_positions.forEach(
        (current_entry) => {
            if (current_entry[1] < current_entry[0]){
                current_entry[0] = current_entry[1]; // We don't really care abt the bigger entry
                current_entry[4] = 1 - current_entry[4];
            }

            if (current_entry[3] < current_entry[2]){
                current_entry[2] = current_entry[3]; // We don't really care abt the bigger entry
                current_entry[5] = 1 - current_entry[5];
            }

            const to_push = [current_entry[0], current_entry[2], current_entry[4], current_entry[5]];
            const rel_position = l1_rel_points[to_push[0]].mult(1 - to_push[2]).add(
                l1_rel_points[to_push[0] + 1].mult(to_push[2])
            );

            to_push.push(l1_to_abs(rel_position));
            cleaned_ip.push(to_push);
        }
    );
    return cleaned_ip;
}

function _filter_intersection_positions(cleaned_ip, line1, line2){

    // Filter #1
    cleaned_ip.sort((a,b) => a[1] + a[3] - b[1] - b[3]);
    cleaned_ip.unshift([null, 0       , null, 0, line2.p1]);
    cleaned_ip.push(   [null, Infinity, null, 0, line2.p2]);

    const filtered_ip0 = [];

    for (let ip of cleaned_ip) {
        if (filtered_ip0.length > 0 && filtered_ip0[filtered_ip0.length - 1][4].distance(ip[4]) < 0.001){
            continue;
        }

        filtered_ip0.push(ip);
    }

    // Filter #2
    filtered_ip0[0] =                       [0,        null, 0, null, line1.p1];
    filtered_ip0[filtered_ip0.length - 1] = [Infinity, null, 0, null, line1.p2];
    filtered_ip0.sort((a,b) => a[0] + a[2] - b[0] - b[2]);


    const filtered_ip = [];

    for (let ip of filtered_ip0) {
        if (filtered_ip.length > 0 && filtered_ip[filtered_ip.length - 1][4].distance(ip[4]) < 0.001){
            continue;
        }

        filtered_ip.push(ip);
    }

    filtered_ip.shift();
    filtered_ip.pop();
    // Sorted after line 1

    return filtered_ip;
}

function _line_segments_intersect(start1, end1, start2, end2) {
    // We are a bit generous for this fn, we don't want to miss any!
    const denominator = (end2.y - start2.y) * (end1.x - start1.x) - (end2.x - start2.x) * (end1.y - start1.y);

    // If start and end are to close to each other, just consider the points
    if (start1.distance(end1) < EPSILON){
        if (start2.distance(end2) < EPSILON){
            if (start1.distance(start2) < EPSILON){
                return [true, 0, 0];
            }
            if (start1.distance(end2) < EPSILON){
                return [true, 0, 1];
            }
            if (end1.distance(start2) < EPSILON){
                return [true, 1, 0];
            }
            if (end1.distance(end2) < EPSILON){
                return [true, 1, 1];
            }
            return [false];
        }

        const closest_start = closest_vec_on_line_segment(
            [start2, end2], start1
        );
        
        const closest_end = closest_vec_on_line_segment(
            [start2, end2], end1
        );

        if (start1.distance(closest_start) < EPSILON){
            return [true, 0, start2.distance(closest_start)/start2.distance(end2)]
        }

        if (end1.distance(closest_end) < EPSILON){
            return [true, 1, start2.distance(closest_end)/start2.distance(end2)]
        }

        return [false]
    } else if (start2.distance(end2) < EPSILON){
        const closest_start = closest_vec_on_line_segment(
            [start1, end1], start2
        );
        
        const closest_end = closest_vec_on_line_segment(
            [start1, end1], end2
        );

        if (start2.distance(closest_start) < EPSILON){
            return [true, start1.distance(closest_start)/start1.distance(end1), 0]
        }

        if (end2.distance(closest_end) < EPSILON){
            return [true, start1.distance(closest_end)/start1.distance(end1), 0]
        }

        return [false]
    }

    // Check if the lines are parallel (denominator is zero)
    if (Math.abs(denominator) < EPSILON) {
        const normalize = affine_transform_from_input_output(
            [start1, end1],
            [new Vector(0,0), new Vector(1, 0)]
        );

        const s2_normal = normalize(start2);
        // Check if on the same line (i.e. x-axis)
        if (Math.abs(s2_normal.y, 0) > EPSILON){
            return [false];
        }

        const e2_normal = normalize(end2);
        if (
            (-EPSILON > s2_normal.x && -EPSILON > e2_normal.x) ||
            (1 + EPSILON < s2_normal.x && 1 + EPSILON < e2_normal.x)
        ){
            return [false];
        }

        const x_arr = [0, 1, s2_normal.x, e2_normal.x].sort();
        const relX_slice = (x_arr[1] + x_arr[2])/2;

        const abs_intersection_pos = start1.mult(1 - relX_slice)
                                .add(end1.mult(relX_slice));

        const relY_slice = start2.distance(abs_intersection_pos)/start2.distance(end2);
        return [true, relX_slice, relY_slice];
    }

    // Find intersection rel amt
    const ua = ((end2.x - start2.x) * (start1.y - start2.y) - (end2.y - start2.y) * (start1.x - start2.x)) / denominator;
    const ub = ((end1.x - start1.x) * (start1.y - start2.y) - (end1.y - start1.y) * (start1.x - start2.x)) / denominator;

    // Check if intersection is within line segments
    if (ua < -EPSILON || ua > 1 + EPSILON || ub < -EPSILON || ub > 1 + EPSILON) {
        return [false];
    }

    // Intersection point is within both line segments
    return [true, ua, ub];
}

function _find_monotone_intersection_positions(s1, s2){
    /*
        // Line segments must go strictly from left to right. (or be single and one x)

        returns ip = [
            [
                Index of first point of linesegment intersection of s1,
                Index of 2nd point of linesegment intersection of s1,
                Index of first point of linesegment intersection of s2,
                Index of 2nd point of linesegment intersection of s2,
                Percentage (fraction) to next point the intersection occured s1,
                Percentage (fraction) to next point the intersection occured s2
            ]
        ]
    */

    const ip = [];

    let s1_index = 0;
    let s2_index = 0;

    while (s1_index < s1.length - 1 && s2_index < s2.length - 1){
        if (s1[s1_index + 1][0].x + EPSILON < s2[s2_index][0].x){
            // The s1_segment is entirely left of the s2 segment
            s1_index++;
            continue;
        } else if (s2[s2_index + 1][0].x + EPSILON < s1[s1_index][0].x){
            // The s2_segment is entirely left of the s1 segment
            s2_index++;
            continue;
        } else {
            // start1    end1          or alike
            //     start2     end2

            const intersection_res = _line_segments_intersect(
                s1[s1_index][0], s1[s1_index + 1][0],
                s2[s2_index][0], s2[s2_index + 1][0]
            );

            if (intersection_res[0]){
                ip.push([
                    s1[s1_index][1], s1[s1_index + 1][1],
                    s2[s2_index][1], s2[s2_index + 1][1],
                    Math.min(
                        1 - EPSILON2, Math.max(intersection_res[1], EPSILON2)
                    ),
                    Math.min(
                        1 - EPSILON2, Math.max(intersection_res[2], EPSILON2)
                    )
                ]);
            }

            // start1              end1
            //     start2     end2

            if (s2[s2_index + 1][0].x - s1[s1_index + 1][0].x < 0){
                s2_index++;
                continue;
            }

            s1_index++;
            continue;
        }
    }

    return ip;
}

function _get_monotone_segments(coords) { // By GPT, some care
    if (coords.length === 0) return [];

    let monotone_segments = [];
    let last_x = coords[0][0].x;
    let current_direction = 1;

    while (coords.length > 1) {
        let segment_end = 1;

        while (segment_end < coords.length && (coords[segment_end][0].x - last_x) * current_direction > 0) {
            last_x = coords[segment_end][0].x;
            segment_end++;
        }

        let new_segment = coords.splice(0, segment_end);
        if (monotone_segments.length > 0) {
            new_segment.unshift(monotone_segments[monotone_segments.length - 1].slice(-1)[0]);
        }
        monotone_segments.push(new_segment);

        if (coords.length > 0) {
            current_direction *= -1;
            last_x = coords[0][0].x;
        }
    }

    if (coords.length > 0) {
        monotone_segments.push(coords);
    }

    for (let i = 1; i < monotone_segments.length; i += 2) {
        monotone_segments[i].reverse();
    }

    return monotone_segments;
}


function _get_monotone_segments_new_broken(coords){
    if (coords.length === 0) return [];
    
    let monotone_segments = [];
    let last_x = coords[0][0].x;

    let last_index = 0;         // Inside the coords array, corresponds to last_x
    let current_direction = 1;  // In positiv (1) or negative (-1) x direction

    while (coords.length > last_index + 1){
        const new_x = coords[last_index + 1][0].x;
        
        if ((new_x - last_x) * current_direction > 0){
            last_index++;
            last_x = new_x;
            continue;
        }

        if (coords.length == last_index - 1) break;
        const new_segment = coords.splice(0, last_index);
        new_segment.push(coords[0]);
        monotone_segments.push(new_segment);


        last_index = 0;
        current_direction *= -1;
        last_x = coords[0][0].x;
    }

    monotone_segments.push(coords);

    for (let i = 0; i < monotone_segments.length; i++) {
        if (i % 2 == 1){
            monotone_segments[i].reverse();
        }
    }

    return monotone_segments;
}

function _old_get_monotone_segments(coords){
    const first_el = coords.shift();
    let monotone_segments = [[first_el]];
    let last_x = first_el[0].x;
    let current_direction = 1;
    while (coords.length > 0){
        const el = coords.shift();
        if ((el[0].x - last_x) * current_direction > 0){
            monotone_segments[monotone_segments.length - 1].push(el);
        } else {
            const last_monotone_component = monotone_segments[monotone_segments.length - 1];

            monotone_segments.push([
                last_monotone_component[last_monotone_component.length - 1],
                el
            ]);
            current_direction *= -1;
        }

        last_x = el[0].x;
    }

    for (let i = 0; i < monotone_segments.length; i++) {
        if (i % 2 == 1){
            monotone_segments[i].reverse();
        }
    }

    return monotone_segments;
}