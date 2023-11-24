const { Point } = require('../point.js');

module.exports = function intersect_lines(sketch, line1, line2, assurances = { is_staight: true }){
    /*
        params assurances: 
            { l2_stepsize_percent: 10, l2_stepsize_percent: 10}
            -> If you recursivelytest only on x percent of the lines, you will find all points
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
    for (let i = 0; i < l2_abs_sample_points.length - 1; i++){
        const [intersect, ...where] = line_segments_intersect(...enpoints, l2_abs_sample_points[i], l2_abs_sample_points[i+1]);
        if (!intersect) continue;
        if (where[1] == 1){
            i++; // Bcs otherwise would be counted as [_, 0] on the next one
        }

        const obj = {
            line2_left_pt: i, // index
            line2_left_percent: where[1],
            line1_left_pt: Math.floor((l1_abs_sample_points.length - 1) * where[0]),
            line1_left_percent: (l1_abs_sample_points.length - 1) * where[0] - Math.floor(l1_abs_sample_points.length * where[0]),
        };

        // Math.floor errors
        if (obj.line1_left_percent < -0.0001){
            obj.line1_left_percent += 1;
        }

        if (obj.line2_left_percent < -0.0001){
            obj.line2_left_percent += 1;
        }

        intersection_positions.push(obj);
    }

    // If one intersection point might be endpoint: Ignore
    intersection_positions = intersection_positions.filter(p => {
        const l1_pt0 = p.line1_left_pt + p.line1_left_percent < 0.01;
        const l2_pt0 = p.line2_left_pt + p.line2_left_percent < 0.01;
        const l1_pt1 = p.line1_left_pt + p.line1_left_percent > l1_abs_sample_points.length - 0.01;
        const l2_pt1 = p.line2_left_pt + p.line2_left_percent > l2_abs_sample_points.length - 0.01;
        return !(l1_pt0 || l1_pt1 || l2_pt0 || l2_pt1);
    });

    // Split into sublines
    intersection_positions.forEach(p => {
        const point_vec = l2_abs_sample_points[p.line2_left_pt].mult(1 - p.line2_left_percent)
                              .add(l2_abs_sample_points[p.line2_left_pt + 1].mult(p.line2_left_percent));

        const intersection_point = new Point(
            point_vec.x, point_vec.y
        );

        p.acutal_point = intersection_point;
        sketch.add_point(intersection_point);
    });

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
        return a.line1_left_percent - b.line1_left_percent;
    });

    // ## Add missing endpoints
    const [l1_start, l1_end] = line1.get_endpoints();
    intersection_positions.unshift({
        line1_left_pt: 0,
        line1_left_percent: 0,
        acutal_point: l1_start
    });

    intersection_positions.push({
        line1_left_pt: l1_abs_sample_points.length,
        line1_left_percent: 0,
        acutal_point: l1_end
    });

    const l1_segments = [];

    for (let i = 0; i < intersection_positions.length - 1; i++){
        const segment_sample_points = line1.cut_sample_points_at(
            intersection_positions[i].line1_left_pt,
            intersection_positions[i].line1_left_percent,
            intersection_positions[i + 1].line1_left_pt,
            intersection_positions[i + 1].line1_left_percent
        );

        l1_segments.push(
            sketch._line_between_points_from_sample_points(
                intersection_positions[i].acutal_point,
                intersection_positions[i + 1].acutal_point,
                segment_sample_points
            )
        );
    }

    // ## Remove endpoints 
    intersection_positions.pop();
    intersection_positions.shift();

    // # Handle Line2
    intersection_positions.sort((a, b) => {
        if (a.line2_left_pt !== b.line2_left_pt) {
            return a.line2_left_pt - b.line2_left_pt;
        }
        return a.line2_left_percent - b.line2_left_percent;
    });

    // ## Add missing endpoints
    const [l2_start, l2_end] = line2.get_endpoints();
    intersection_positions.unshift({
        line2_left_pt: 0,
        line2_left_percent: 0,
        acutal_point: l2_start
    });

    intersection_positions.push({
        line2_left_pt: l2_abs_sample_points.length - 1,
        line2_left_percent: 0,
        acutal_point: l2_end
    });

    const l2_segments = [];

    for (let i = 0; i < intersection_positions.length - 1; i++){
        const segment_sample_points = line2.cut_sample_points_at(
            intersection_positions[i].line2_left_pt,
            intersection_positions[i].line2_left_percent,
            intersection_positions[i + 1].line2_left_pt,
            intersection_positions[i + 1].line2_left_percent
        );

        l2_segments.push(
            sketch._line_between_points_from_sample_points(
                intersection_positions[i].acutal_point,
                intersection_positions[i + 1].acutal_point,
                segment_sample_points
            )
        );
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