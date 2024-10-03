import { Vector, affine_transform_from_input_output, rotation_fun, vec_angle, closest_vec_on_line_segment } from './geometry.js';
import { Point } from './point.js';
import { ConnectedComponent } from './connected_component.js';
import { assert } from '../Debug/validation_utils.js';
import { _line_segments_intersect, _calculate_intersections } from "./unicorns/intersect_lines.js";

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
        if (radius < 0){
            radius += -1;
            direction = 1 - direction;
        }

        if (direction == 1){
            this.swap_orientation();
        }

        let p1  = this.p1.add(
            this.get_tangent_vector(this.p1).get_orthogonal().scale(-1 * radius)
        );

        let p2  = this.p2.add(
            this.get_tangent_vector(this.p2).get_orthogonal().scale(radius)
        );

        const endpoint_distance = p1.subtract(p2).length();

        const this_abs_sample_points = this.get_absolute_sample_points();
        const abs_sample_points = [p1];

        for (let i = 0; i < this_abs_sample_points.length() - 2; i++){
            const left_sp = this_abs_sample_points[i];
            const middle_sp = this_abs_sample_points[i + 1];
            const right_sp = this_abs_sample_points[i + 2];
            {
                // Above the center of the line segment [left, middle]

                const line_center_point = left_sp.add(middle_sp.subtract(left_sp).scale(0.5));
                const orth = middle_sp.subtract(left_sp).get_orthonormal().scale(radius);

                abs_sample_points.push(line_center_point.add(orth));
            }
            {
                // At the corner [left, middle, right]
                const angle_of_new_vec = vec_angle(
                    right_sp.subtract(middle_sp),
                    left_sp.subtract(middle_sp)
                )/2;
                const left_segment = left_sp.subtract(middle_sp);
                const rot_fun = rotation_fun(new Vector(0,0), angle_of_new_vec);
                const vec_to_add = rot_fun(left_segment.normalize()).scale(radius);

                abs_sample_points.push(middle_sp.add(vec_to_add));
            }
        }

        {   // Add point above last line segment
            const left_sp = this_abs_sample_points[this_abs_sample_points.length - 2];
            const middle_sp = this_abs_sample_points[this_abs_sample_points.length - 1];
            const line_center_point = left_sp.add(middle_sp.subtract(left_sp).scale(0.5));
            const orth = middle_sp.subtract(left_sp).get_orthonormal().scale(radius);

            abs_sample_points.push(line_center_point.add(orth));
        }

        // Remove sample points if to tightly spaced
        const min_spacing = 0.0001 * endpoint_distance;
        for (let i = abs_sample_points.length - 2; i > 0; i--){
            if (abs_sample_points[i].subtract(abs_sample_points[i - 1]).length() < min_spacing){
                abs_sample_points.splice(i, 1);
            }
        }


        abs_sample_points.push(p2);
        if (direction == 1){
            this.swap_orientation();
            abs_sample_points.reverse();
        }

        return abs_sample_points;
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

    self_intersects(thorough = false) {
        // The current functions should be seen as temporary till we find smth better
        // Since it either doesn't give garantes or is slow.

        const points = this.sample_points;
        let potentialIntersection = thorough;

        // Quick and easy approximation
        for (let i = 0; i < points.length - 1; i++) {
            for (let j = i + 2; j < points.length - 1; j++) {
                if (points[i].distance(points[i+1]) > points[i].distance(points[j])*0.9) {
                    potentialIntersection = true;
                    break;
                }
            }
            if (potentialIntersection) break;
        }

        if (!potentialIntersection) return false;

        // Slow and thorough
        const intersections = _calculate_intersections(this, this, false);

        for (let i = 0; i < intersections.length; i++) {
            const [i1, i2, p1, p2, _] = intersections[i];
            if (Math.abs(i1 + p1 - i2 - p2) < 1.0001) {
                continue;
            }

            let total_len = 0;
            for (
                let j = Math.min(intersections[i][0], intersections[i][1]);
                j < Math.max(intersections[i][0], intersections[i][1]) - 1;
                j++
            ) {
                total_len += this.sample_points[j].distance(this.sample_points[j + 1]);
            }

            if (total_len > 0.001) {
                return true;
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
