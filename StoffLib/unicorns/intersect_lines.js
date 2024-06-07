/*

    This module needs some updates

*/

import { Point } from '../point.js';
import { interpolate_colors } from '../colors.js';
import { copy_sketch_obj_data } from '../copy.js';

export {
    _intersection_positions, 
    _intersect_lines
}

function _intersect_lines(sketch, line1, line2, assurances = { is_staight: true }){
    /*
        params assurances: 
            { l2_stepsize_ratio: 10, l2_stepsize_ratio: 10}
            -> If you recursivelytest only on x ratio of the lines, you will find all points
            { intersection_count : 5 }
            -> There are so many intersections exactly
            { is_straight: true}
            -> the first line - line1 - is straight (&& evently spaced i.e. not interpolated in strange ways)

        returns: {
            intersection_points: [],
            l1_segments: [],
            l2_segments: []
        }

        Note, that this function deletes line1 and line 2 and replaces them.
    */
        
    // Specific for one being a line
    const l2_abs_sample_points = line2.get_absolute_sample_points();        const l1_abs_sample_points = line1.get_absolute_sample_points();

    const int_color = interpolate_colors(line1.get_color(), line2.get_color(), 0.5);
    const intersection_positions = _intersection_positions(line1, line2, assurances, false);
    intersection_positions.forEach(p => {
        p.acutal_point = new Point(p.point_vec.x, p.point_vec.y, int_color);
        sketch.add_point(p.acutal_point);
    })

    if (intersection_positions.length == 0){
        return {
            intersection_points: [],
            l1_segments: [line1],
            l2_segments: [line2]
        }
    }

    // # Handle Line1
    intersection_positions.sort((a, b) => {
        if (a.line1_left_pt !== b.line1_left_pt) {
            return a.line1_left_pt - b.line1_left_pt;
        }
        return a.line1_left_ratio - b.line1_left_ratio;
    });

    // ## Add missing endpoints
    const [l1_start, l1_end] = line1.get_endpoints();
    intersection_positions.unshift({
        line1_left_pt: 0,
        line1_left_ratio: 0,
        acutal_point: l1_start
    });

    intersection_positions.push({
        line1_left_pt: l1_abs_sample_points.length,
        line1_left_ratio: 0,
        acutal_point: l1_end
    });

    const l1_segments = [];

    for (let i = 0; i < intersection_positions.length - 1; i++){
        const segment_sample_points = line1.cut_sample_points_at(
            intersection_positions[i].line1_left_pt,
            intersection_positions[i].line1_left_ratio,
            intersection_positions[i + 1].line1_left_pt,
            intersection_positions[i + 1].line1_left_ratio
        );

        const l1_segment = sketch._line_between_points_from_sample_points(
            intersection_positions[i].acutal_point,
            intersection_positions[i + 1].acutal_point,
            segment_sample_points
        );

        copy_sketch_obj_data(line1, l1_segment);
        l1_segments.push(l1_segment);
    }

    // ## Remove endpoints 
    intersection_positions.pop();
    intersection_positions.shift();

    // # Handle Line2
    intersection_positions.sort((a, b) => {
        if (a.line2_left_pt !== b.line2_left_pt) {
            return a.line2_left_pt - b.line2_left_pt;
        }
        return a.line2_left_ratio - b.line2_left_ratio;
    });

    // ## Add missing endpoints
    const [l2_start, l2_end] = line2.get_endpoints();
    intersection_positions.unshift({
        line2_left_pt: 0,
        line2_left_ratio: 0,
        acutal_point: l2_start
    });

    intersection_positions.push({
        line2_left_pt: l2_abs_sample_points.length - 1,
        line2_left_ratio: 0,
        acutal_point: l2_end
    });

    const l2_segments = [];

    for (let i = 0; i < intersection_positions.length - 1; i++){
        const segment_sample_points = line2.cut_sample_points_at(
            intersection_positions[i].line2_left_pt,
            intersection_positions[i].line2_left_ratio,
            intersection_positions[i + 1].line2_left_pt,
            intersection_positions[i + 1].line2_left_ratio
        );

        const l2_segment = sketch._line_between_points_from_sample_points(
            intersection_positions[i].acutal_point,
            intersection_positions[i + 1].acutal_point,
            segment_sample_points
        );

        copy_sketch_obj_data(line2, l2_segment);
        l2_segments.push(l2_segment);
    }

    // ## Remove endpoints 
    intersection_positions.pop();
    intersection_positions.shift();

    // # Continuing
    sketch.remove_line(line1);
    sketch.remove_line(line2);

    return {
        intersection_points: intersection_positions.map(p => p.acutal_point),
        l1_segments,
        l2_segments
    }
}

function _intersection_positions(line1, line2, assurances = { is_staight: true }, ret_only_vecs = true){
    /*
        params assurances: 
            { l2_stepsize_ratio: 10, l2_stepsize_ratio: 10}
            -> If you recursivelytest only on x ratio of the lines, you will find all points
            { intersection_count : 5 }
            -> There are so many intersections exactly
            { is_straight: true}
            -> the first line - line1 - is straight (&& evently spaced i.e. not interpolated in strange ways)

        returns: [vec]

        If ret_only_vecs is set to false it returns the data needed for intersect_lines
    */

    if (assurances.is_staight !== true){
        throw new Error("Currently require line1 to be straight");
    }

    function line_segments_intersect(start1, end1, start2, end2) {
        const denominator = (end2.y - start2.y) * (end1.x - start1.x) - (end2.x - start2.x) * (end1.y - start1.y);
    
        // Check if the lines are parallel (denominator is zero)
        if (denominator === 0) {
            return [false, null];
        }
    
        const ua = ((end2.x - start2.x) * (start1.y - start2.y) - (end2.y - start2.y) * (start1.x - start2.x)) / denominator;
        const ub = ((end1.x - start1.x) * (start1.y - start2.y) - (end1.y - start1.y) * (start1.x - start2.x)) / denominator;

        // Check if intersection is within line segments
        if (ua < 0 || ua > 1 || ub < 0 || ub > 1) {
            return [false, null];
        }
    
        // Intersection point is within both line segments
        return [true, ua, ub];
    }

    let intersection_positions = [];

    // Specific for one being a line
    const l2_abs_sample_points = line2.get_absolute_sample_points();
    const l1_abs_sample_points = line1.get_absolute_sample_points();
    
    const enpoints = line1.get_endpoints();
    for (let i = 1; i < l2_abs_sample_points.length - 2; i++){
        // You may want to go from 0 to l2_abs_sample_points.length - 1, however you risk to include edges
        const [intersect, ...where] = line_segments_intersect(...enpoints, l2_abs_sample_points[i], l2_abs_sample_points[i+1]);
        if (!intersect) continue;
        
        const line1_left_pt = Math.floor((l1_abs_sample_points.length - 1) * where[0]);

        const obj = {
            line2_left_pt: i, // index
            line2_left_ratio: where[1],
            line1_left_pt,
            line1_left_ratio: (l1_abs_sample_points.length - 1) * where[0] - line1_left_pt,
        };

        intersection_positions.push(obj);
    }

    intersection_positions = clean_intersection_positions(intersection_positions);

    // If one intersection point might be endpoint: Ignore
    intersection_positions = intersection_positions.filter(p => {
        const l1_pt0 = p.line1_left_pt + p.line1_left_ratio < 0.01;
        const l2_pt0 = p.line2_left_pt + p.line2_left_ratio < 0.01;
        const l1_pt1 = p.line1_left_pt + p.line1_left_ratio > l1_abs_sample_points.length - 0.01;
        const l2_pt1 = p.line2_left_pt + p.line2_left_ratio > l2_abs_sample_points.length - 0.01;
        return !(l1_pt0 || l1_pt1 || l2_pt0 || l2_pt1);
    });

    // Split into sublines
    return intersection_positions.map(p => {
        const point_vec = l2_abs_sample_points[p.line2_left_pt].mult(1 - p.line2_left_ratio)
                            .add(l2_abs_sample_points[p.line2_left_pt + 1].mult(p.line2_left_ratio));

        if (ret_only_vecs){
            return point_vec;
        } else {
            p.point_vec = point_vec;
            return p;
        }
    });
}

function clean_intersection_positions(intersection_positions){
    // Very basic
    for (let i = intersection_positions.length - 1; i > 0; i--){
        const ip1 = intersection_positions[i];
        const ip0 = intersection_positions[i - 1];

        if (
            Math.abs(ip0.line2_left_pt + ip0.line2_left_ratio - ip1.line2_left_pt - ip1.line2_left_ratio) < 0.001
            || 
            Math.abs(ip0.line1_left_pt + ip0.line1_left_ratio - ip1.line1_left_pt - ip1.line1_left_ratio) < 0.001
        ){
            intersection_positions.splice(i, 1);
        }
    }

    return intersection_positions;
}