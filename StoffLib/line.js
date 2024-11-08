import { Vector, line_segments_intersect, affine_transform_from_input_output, closest_vec_on_line_segment, convex_hull } from './geometry.js';
import { Point } from './point.js';
import { ConnectedComponent } from './connected_component.js';
import { assert } from '../Debug/validation_utils.js';
import { _calculate_intersections } from "./unicorns/intersect_lines.js";
import offset_sample_points from './unicorns/offset_sample_points.js';

class Line{
    constructor(endpoint_1, endpoint_2, sample_points, color = "black"){
        /*
            Sample points is an array of values [x(t), y(t)] with
            x(t), y(t) relative to the endpoints, t starts at 0 (including it) and goes to 1 (including it)

            I.E. x moves along P1->P2 (with x(0) being P1, x(1) being P2) and y perpendicular in same scale
            There might be exceptions to the above but very hard to deal with!!
        */

        this.attributes = {
            stroke: color,
            strokeWidth: 1,
            opacity: 1
        };
        this.data = {};
        this.sketch = null;

        this.p1 = endpoint_1;
        this.p2 = endpoint_2;

        this.sample_points = sample_points;

        function approx_eq(v1, v2){
            return v1.subtract(v2).length_squared() < .01
        }

        if (approx_eq(this.sample_points[0], new Vector(0,0))){
            this.sample_points[0] = new Vector(0,0);
        } else {
            throw new Error("Line sample points dont start with (0,0)");
        }

        if (approx_eq(this.sample_points[this.sample_points.length - 1], new Vector(1,0))){
            this.sample_points[this.sample_points.length - 1] = new Vector(1,0);
        } else {
            throw new Error("Line sample points dont end with (1,0)");
        }
    
        endpoint_1.add_adjacent_line(this);
        endpoint_2.add_adjacent_line(this);
    }

    offset_sample_points(radius, direction = 0){
        return offset_sample_points(this, radius, direction);
    }

    is_adjacent(thing){
        if (thing instanceof Point){
            return thing == this.p1 || thing == this.p2
        }

        if (thing instanceof Line){
            return this.common_endpoint(thing) !== null;
        }

        throw new Error("Unexpected thing comparing against.");
    }

    common_endpoint(line){
        if (this.p1 == line.p1 || this.p1 == line.p2){
            return this.p1;
        }
        if (this.p2 == line.p1 || this.p2 == line.p2){
            return this.p2;
        }

        return null;
    }

    set_endpoints(p1, p2){
        this.p1.remove_line(this);
        this.p2.remove_line(this);

        this.p1 = p1;
        this.p2 = p2;

        p1.add_adjacent_line(this);
        p2.add_adjacent_line(this);

        return this;
    }

    set_color(color){
        this.attributes.stroke = color;
        return this;
    }

    get_color(){
        return this.attributes.stroke;
    }

    set_attribute(attr, value){
        this.attributes[attr] = value;
        return this;
    }

    get_attribute(attr){
        return this.attributes[attr];
    }

    get_sample_points(){
        return this.sample_points;
    }

    connected_component(){
        return new ConnectedComponent(this);
    }

    copy_sample_points(){
        return this.sample_points.map(v => new Vector(v));
    }

    cut_sample_points_at(index_from, from_percentage_after, index_to, to_percentage_after){
        const cut_sample_points = this.sample_points.slice(index_from, index_to + 2); // One after last one included if needed interpolation

        if (from_percentage_after > 0){
            cut_sample_points[0] = cut_sample_points[0].mult(1 - from_percentage_after)
                                    .add(cut_sample_points[1].mult(from_percentage_after));
        }

        if (to_percentage_after == 0 && !(index_to + 1 == this.sample_points.length)){
            cut_sample_points.pop();
        } else if (to_percentage_after == 0) {} else {
            const l = cut_sample_points.length - 1;
            cut_sample_points[l] = cut_sample_points[l - 1].mult(1 - to_percentage_after)
                                      .add(cut_sample_points[l].mult(to_percentage_after));
        }

        const transform_func = affine_transform_from_input_output(
            [cut_sample_points[0], cut_sample_points[cut_sample_points.length - 1]],
            [new Vector(0,0), new Vector(1,0)]
        );

        const res = cut_sample_points.map(p => transform_func(p));
        return res;
    }

    get_to_relative_function(){
        return affine_transform_from_input_output(
            [this.p1,  this.p2],
            [new Vector(0,0), new Vector(1,0)]
        );
    }

    get_to_absolute_function(){
        return affine_transform_from_input_output(
            [new Vector(0,0), new Vector(1,0)],
            [this.p1,  this.p2]
        );
    }

    vec_to_absolue(vec){
        return this.get_to_absolute_function()(vec);
    }

    get_absolute_sample_points(){
        const to_absolute = this.get_to_absolute_function();
        return this.sample_points.map(p => {
            return to_absolute(p)
        });
    }

    get_line_vector(){
        return this.p2.subtract(this.p1);
    }

    get_endpoints(){
        return [this.p1, this.p2];
    }

    get_tangent_vector(pt){
        if (!this.get_endpoints().includes(pt)){
            throw new Error("Point is not endpoint of line.");
        }

        const to_absolute = this.get_to_absolute_function();
        if (pt == this.p1){
            return this.p1.subtract(to_absolute(this.sample_points[1])).normalize();
        } else {
            const tangent_point = this.sample_points[this.sample_points.length - 2];
            return this.p2.subtract(to_absolute(tangent_point)).normalize();
        }
    }

    mirror(direction = false){
        if (direction){
            const t = this.p1;
            this.p1 = this.p2;
            this.p2 = t;
            // This performs double mirror
        }
        this.sample_points.forEach(p => p.set(p.x, - p.y));
        return this;
    }

    swap_orientation(){
        const t = this.p1;
        this.p1 = this.p2;
        this.p2 = t;
        this.sample_points.reverse();
        this.sample_points.forEach(p => p.set(1 - p.x, -p.y));

        return this;
    }

    reverse(){
        return this.swap_orientation();
    }

    endpoint_distance(){
        return this.p1.distance(this.p2);
    }

    length(){
        return this.get_length();
    }

    get_length(){
        const endpoint_distance = this.endpoint_distance();
        let sum = 0;

        for (let i = 0; i < this.sample_points.length - 1; i++){
            sum += Math.sqrt(
                Math.pow(this.sample_points[i][1] - this.sample_points[i+1][1], 2) +
                Math.pow(this.sample_points[i][0] - this.sample_points[i+1][0], 2)
            );
        }

        return sum * endpoint_distance;
    }

    get_bounding_box(){
        let _min_x = Infinity;
        let _min_y = Infinity;
        let _max_x = - Infinity;
        let _max_y = - Infinity;

        this.get_absolute_sample_points().forEach(p => {
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

    convex_hull(){
        return convex_hull(this.get_absolute_sample_points());
    }

    is_adjacent(thing){
        if (thing instanceof Point){
            return thing == this.p1 || thing == this.p2
        }

        if (thing instanceof Line){
            return this.common_endpoint(thing) !== null;
        }

        throw new Error("Unexpected thing comparing against.");
    }

    common_endpoint(line){
        if (this.p1 == line.p1 || this.p1 == line.p2){
            return this.p1;
        }
        if (this.p2 == line.p1 || this.p2 == line.p2){
            return this.p2;
        }

        return null;
    }

    abs_normalized_sample_points(k = 1000){
        k = Math.round(k);

        const total_len = this.get_length();
        const step_size = 1/k;
        const sample_point_distance = total_len * step_size;

        const sp = this.get_absolute_sample_points();
        const res = [sp[0]];

        let current_sp_index = 0;
        let point_for_distance_from = sp[0]; // Is or is after sp[current_sp_index]
        let distance_left = sample_point_distance;

        while (current_sp_index < sp.length - 1){
            let distance_to_next_sp_point = point_for_distance_from.subtract(sp[current_sp_index + 1]).length();
            if (distance_to_next_sp_point < distance_left){
                distance_left -= distance_to_next_sp_point;
                current_sp_index += 1;
                point_for_distance_from = sp[current_sp_index];
            } else {
                const next_sample_point = point_for_distance_from.add(
                    sp[current_sp_index + 1].subtract(point_for_distance_from).normalize().mult(distance_to_next_sp_point)
                );

                point_for_distance_from = next_sample_point;
                res.push(next_sample_point);
                distance_left = sample_point_distance;
            }
        }

        if (sp[sp.length - 1].subtract(res[res.length - 1]).length() < sample_point_distance * .3){
            res.pop();
        }

        res.push(sp[sp.length - 1]);

        return res;
    }

    position_at_length(length, reversed = false){
        const l = this.get_length();

        if (length > l){
            throw new Error("Specified length is longer than line.");
        }

        if (reversed){
            length = l - length;
        }

        const endpoint_distance = this.endpoint_distance();
        const adjusted_length = length/endpoint_distance;

        let sum = 0;
        for (let i = 0; i < this.sample_points.length - 1; i++){
            const next_length = Math.sqrt(
                Math.pow(this.sample_points[i][1] - this.sample_points[i+1][1], 2) +
                Math.pow(this.sample_points[i][0] - this.sample_points[i+1][0], 2)
            );

            if (sum <= adjusted_length && sum + next_length >= adjusted_length){
                const left_to_walk = adjusted_length - sum;
                const fraction_left = left_to_walk/next_length;

                const relative_vec = this.sample_points[i].mult(1-fraction_left)
                        .add(this.sample_points[i+1].mult(fraction_left));

                return this.vec_to_absolue(relative_vec);
            }

            sum += next_length;
        }

        assert(false, "This should not happen!");
    }

    vec_at_length(d){
        return this.p1.add(this.get_line_vector().normalize().scale(d));
    }

    vec_at_fraction(f){
        return this.vec_at_length(f * this.length());
    }

    position_at_fraction(f){
        return this.position_at_length(f * this.length());
    }

    closest_position(vec){
        const vec_rel = this.get_to_relative_function()(vec);

        let min = Infinity;
        let best = null;

        for (let i = 0; i < this.sample_points.length - 1; i++){
            const closest_on_line = closest_vec_on_line_segment([
                this.sample_points[i], this.sample_points[i + 1]
            ], vec_rel);
            const dist = closest_on_line.distance(vec_rel);

            if (dist < min){
                min = dist;
                best = closest_on_line;
            }
        }

        return this.get_to_absolute_function()(best);
    }

    set_sketch(s, overwrite = false){
        if (this.sketch == null || overwrite || s == null){
            this.sketch = s;
            return this;
        }

        throw new Error("Line already belongs to a sketch!");
    }

    _remove_duplicate_points() {
        if (this.sample_points.length <= 1) return;
    
        this.sample_points = this.sample_points.filter((point, index) => {
            // Skip the first point, compare each with the previous
            if (index === 0) return true;
            const prevPoint = this.sample_points[index - 1];
            return !(point.x === prevPoint.x && point.y === prevPoint.y);
        });
    }    

    self_intersects() {
        const monotone_segments = [];
        let start = 0;
        let i = 1;
    
        // Step 1: Split into monotone segments while skipping duplicate points
        while (i < this.sample_points.length) {
            let prev = this.sample_points[start];
            let curr = this.sample_points[i];
    
            // Skip duplicates
            while (i < this.sample_points.length && curr.x === prev.x && curr.y === prev.y) {
                i++;
                curr = this.sample_points[i];
            }
    
            if (i === this.sample_points.length) {
                break;
            }
    
            const x_diff = curr.x - prev.x;
            const y_diff = curr.y - prev.y;
    
            const x_increasing = x_diff > 0;
            const x_decreasing = x_diff < 0;
            const y_increasing = y_diff > 0;
            const y_decreasing = y_diff < 0;
    
            while (i + 1 < this.sample_points.length) {
                let next = this.sample_points[i + 1];
    
                // Skip duplicates
                while (i + 1 < this.sample_points.length && next.x === curr.x && next.y === curr.y) {
                    i++;
                    next = this.sample_points[i + 1];
                }
    
                if (i + 1 === this.sample_points.length) {
                    break;
                }
    
                const next_x_diff = next.x - curr.x;
                const next_y_diff = next.y - curr.y;
    
                if ((x_increasing && next_x_diff <= 0) ||
                    (x_decreasing && next_x_diff >= 0) ||
                    (x_diff === 0 && ((y_increasing && next_y_diff <= 0) || (y_decreasing && next_y_diff >= 0)))) {
                    // Monotonicity breaks
                    break;
                }
    
                i++;
                prev = curr;
                curr = next;
            }
    
            monotone_segments.push([start, i]);
            start = i;
            i = i + 1;
        }
    
        // Step 2: Build line segments excluding zero-length segments
        const segment_lines = monotone_segments.map(([start, end]) => {
            const lines = [];
            let prevIndex = start;
    
            // Find the first non-duplicate point
            while (prevIndex < end && this.sample_points[prevIndex].x === this.sample_points[prevIndex + 1]?.x &&
                   this.sample_points[prevIndex].y === this.sample_points[prevIndex + 1]?.y) {
                prevIndex++;
            }
    
            for (let j = prevIndex + 1; j <= end; j++) {
                const currIndex = j;
    
                // Skip duplicates
                while (currIndex <= end && this.sample_points[prevIndex].x === this.sample_points[currIndex].x &&
                       this.sample_points[prevIndex].y === this.sample_points[currIndex].y) {
                    j++;
                }
    
                if (j > end) {
                    break;
                }
    
                const p1 = this.sample_points[prevIndex];
                const p2 = this.sample_points[currIndex];
    
                // Skip zero-length segments
                if (p1.x === p2.x && p1.y === p2.y) {
                    prevIndex = currIndex;
                    continue;
                }
    
                lines.push([p1, p2]);
                prevIndex = currIndex;
            }
    
            return lines;
        });
    
        // Step 3: Check for intersections between monotone segments
        for (let i = 0; i < segment_lines.length - 1; i++) {
            const lines1 = segment_lines[i];
    
            // Get x-range for lines1
            const x_values1 = lines1.flatMap(([p1, p2]) => [p1.x, p2.x]);
            const minX1 = Math.min(...x_values1);
            const maxX1 = Math.max(...x_values1);
    
            for (let j = i + 1; j < segment_lines.length; j++) {
                const lines2 = segment_lines[j];
    
                // Get x-range for lines2
                const x_values2 = lines2.flatMap(([p1, p2]) => [p1.x, p2.x]);
                const minX2 = Math.min(...x_values2);
                const maxX2 = Math.max(...x_values2);
    
                // Skip if x-ranges don't overlap
                if (maxX1 < minX2 || maxX2 < minX1) {
                    continue;
                }
    
                // Compare line segments between lines1 and lines2
                for (const [p1, p2] of lines1) {
                    for (const [q1, q2] of lines2) {
                        // Skip shared endpoints for consecutive segments
                        if ((p2.x === q1.x && p2.y === q1.y) || (p1.x === q2.x && p1.y === q2.y)) {
                            continue;
                        }
    
                        const [intersects, _] = line_segments_intersect([p1, p2], [q1, q2]);
                        if (intersects) {
                            return true;
                        }
                    }
                }
            }
        }
    
        return false;
    } 

    toString(){
        return "[Line]"
    }

    toJSON(){
        return this.sample_points;
    }
}

class StraightLine extends Line{
    constructor(endpoint_1, endpoint_2, density){
        const n = Math.ceil(1 / density);

        super(
            endpoint_1,
            endpoint_2,
            Array.from({ length: n + 1 }, (v, i) => new Vector(i/n, 0))
        );
    }

    get_length(){
        return this.get_line_vector().length();
    }

    position_at_length(d){
        return Point.from_vector(this.vec_at_length(d));
    }

    closest_position(vec){
        const rel = this.get_to_relative_function()(vec);
        return this.get_to_absolute_function()(new Vector(rel.x, 0));
    }
}

export { StraightLine, Line };
