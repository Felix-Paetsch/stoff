const { Vector, affine_transform_from_input_output, vec_angle_clockwise } = require("../Geometry/geometry.js");
const { StraightLine, Line } = require('./line.js');
const { Point } = require('./point.js');

class Sketch{
    constructor(h = .005){
        this.sample_density = h;
        this.points = [];
        this.lines  = [];
    }

    get_bounding_box(){
        let _min_x = Infinity;
        let _min_y = Infinity;
        let _max_x = - Infinity;
        let _max_y = - Infinity;

        this.lines.forEach(l => {
            const { top_left, bottom_right } = l.get_bounding_box();
            
            _min_x = Math.min(top_left.x, _min_x);
            _max_x = Math.max(bottom_right.x, _max_x);
            _min_y = Math.min(top_left.y, _min_y);
            _max_y = Math.max(bottom_right.y, _max_y);
        });
        
        this.points.forEach(p => {
            _min_x = Math.min(p.x, _min_x);
            _max_x = Math.max(p.x, _max_x);
            _min_y = Math.min(p.y, _min_y);
            _max_y = Math.max(p.y, _max_y);
        });

        return {
            width:  _max_x - _min_x,
            height: _max_y - _min_y,
            top_left:  new Vector(_min_x, _min_y),
            top_right: new Vector(_max_x, _min_y),
            bottom_left:  new Vector(_min_x, _max_y),
            bottom_right: new Vector(_max_x, _max_y)
        }
    }

    add_point(pt){
        this.points.push(pt);
        return pt;
    }

    get_points(){
        return this.points;
    }

    get_lines(){
        return this.lines;
    }

    line_between_points(pt1, pt2, file = null){
        this._guard_points_in_sketch(pt1, pt2);

        if (file == null){
            const l = new StraightLine(pt1, pt2, this.sample_density);
            this.lines.push(l);
            return l;
        } else {
            throw new Error("Unimplemented!");
        }
    }

    _line_between_points_from_sample_points(pt1, pt2, sp){
        this._guard_points_in_sketch(pt1, pt2);

        const l = new Line(pt1, pt2, sp);
        this.lines.push(l);
        return l;
    }

    interpolate_lines(line1, line2, direction = 0, f = (x) => x, p1 = (x) => x, p2 = (x) => x, auf_bogenlaenge = false){
        // Interpoliert line1 und line2.
        // p1 und p2 geben zu jedem Zeitpunkt t an, wo wir uns auf den jeweiligen Linien befinden
        //      bevorzugt p_i(0) = 0 und p_i(1) = 1
        //      auf_bogenlaenge = false -> Prozentsatz der SamplePoints
        //      auf_bogenlaenge = true  -> kurve auf Bogenlänge parametrisiert
        // f gibt an, wie viel von p_1, wie viel von p_2
        //      annahme: f(0) = 0 => wir sind bei Punkt 1 von Linie 1
        //               f(1) = 1 => wir sind bei Punkt 2 von Linie 2
        // direction 0-3: ändert welche Punkte jeweils als Start-/Endpunkte gewählt werden sollen (1 bis 4)
        
        this._guard_lines_in_sketch(line1, line2);

        function avg_point(line, position){
            // position is a number between 0 and 1
            const sample_points = line.get_sample_points();
            const len = sample_points.length;
            const index = position * (len - 1);

            if (Math.floor(index) == Math.ceil(index)){
                return sample_points[index];
            }

            let left_space  = index - Math.floor(index);
            let right_space = Math.ceil(index) - index;

            const p_left  = sample_points[Math.floor(index)].mult(right_space);
            const p_right = sample_points[Math.ceil(index)].mult(left_space);

            return p_left.add(p_right);
        }

        if (direction == 1 || direction == 3){
            line1._swap_orientation();
        }

        if (direction == 2 || direction == 3){
            line2._swap_orientation();
        }

        let [endpoint_L11, endpoint_L12] = line1.get_endpoints();
        let [endpoint_L21, endpoint_L22] = line2.get_endpoints();

        let start = endpoint_L11;
        let end   = endpoint_L22;

        const line1_to_abs_coords = line1.get_to_absolute_function();
        const line2_to_abs_coords = line2.get_to_absolute_function();

        const abs_to_rel = affine_transform_from_input_output(
            [start,  end],
            [new Vector(0,0), new Vector(1,0)]
        );

        const line1_to_rel_coords = (x) => abs_to_rel(line1_to_abs_coords(x));
        const line2_to_rel_coords = (x) => abs_to_rel(line2_to_abs_coords(x));

        const n = Math.ceil(1/this.sample_density);
        const sample_points = Array.from({ length: n + 1 }, (v, i) => {
            const t = i/n;

            const avg_1_target_coord = line1_to_rel_coords(avg_point(line1, p1(t)));
            const avg_2_target_coord = line2_to_rel_coords(avg_point(line2, p2(t)));
            const f_t = f(t);

            return avg_1_target_coord.mult(1 - f_t)
                    .add(avg_2_target_coord.mult(f_t))
        });

        if (direction == 1 || direction == 3){
            line1._swap_orientation();
        }

        if (direction == 2 || direction == 3){
            line2._swap_orientation();
        }

        return this._line_between_points_from_sample_points(
            start, 
            end, 
            sample_points
        )
    }

    intersect_lines(line1, line2, assurances = { is_staight: true }){
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

        const intersection_positions = [];

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

            intersection_positions.push({
                line2_left_pt: i, // index
                line2_left_percent: where[1],
                line1_left_pt: Math.floor((l1_abs_sample_points.length - 1) * where[0]),
                line1_left_percent: (l1_abs_sample_points.length - 1) * where[0] - Math.floor(l1_abs_sample_points.length * where[0]),
            });
        }

        // Split into sublines
        intersection_positions.forEach(p => {
            const point_vec = l2_abs_sample_points[p.line2_left_pt].mult(1 - p.line2_left_percent)
                                  .add(l2_abs_sample_points[p.line2_left_pt + 1].mult(p.line2_left_percent));

            const intersection_point = new Point(
                point_vec.x, point_vec.y
            );

            p.acutal_point = intersection_point;
            this.add_point(intersection_point);
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
                this._line_between_points_from_sample_points(
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
                this._line_between_points_from_sample_points(
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
        this.remove_line(line1);
        this.remove_line(line2);

        return {
            intersection_points: intersection_positions.map(p => p.acutal_point),
            l1_segments,
            l2_segments
        }
    }

    copy_line(line, from, to){
        this._guard_points_in_sketch(from, to);
        const l = new Line(from, to, line.get_sample_points());
        this.lines.push(l);
        return l;
    }

    remove_line(line){
        this._guard_lines_in_sketch(line);
        line.get_endpoints().forEach(p => p.remove_line(line));
        this.lines = this.lines.filter(l => l !== line);
    }

    remove_point(pt){
        this._guard_points_in_sketch(pt);
        pt.get_adjacent_lines().forEach(l => {
            this.remove_line(l);
        });

        this.points = this.points.filter(p => p !== pt);
    }

    clear(){
        this.points = [];
        this.lines  = [];
    }

    _guard_points_in_sketch(...pt){
        if (!this._has_points(...pt)){
            throw new Error("Points are not part of the sketch.");
        }
    }

    _has_points(...pt){
        for (let i = 0; i < pt.length; i++){
            if (!this.points.includes(pt[i])) return false;
        }
        return true;
    }

    _guard_lines_in_sketch(...ls){
        if (!this._has_lines(...ls)){
            throw new Error("Lines are not part of the sketch.");
        }
    }

    _has_lines(...ls){
        for (let i = 0; i < ls.length; i++){
            if (!this.lines.includes(ls[i])) return false;
        }
        return true;
    }
}

module.exports = { Sketch };