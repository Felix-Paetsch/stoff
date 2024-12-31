import { PlainLine, Vector, affine_transform_from_input_output, closest_vec_on_line_segment, convex_hull, EPS } from './geometry.js';
import Point from './point.js';
import ConnectedComponent from './connected_component.js';
import assert from './assert.js';
import { _calculate_intersections } from "./unicorns/intersect_lines.js";
import offset_sample_points from './unicorns/offset_sample_points.js';
import add_self_intersection_test from './unicorns/self_intersects.js';
import CONF from './config.json' assert { type: 'json' };

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
        this.self_intersection_cache = {
            sp: null,
            self_intersects: null
        };

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

        if (typeof this._init !== "undefined"){
            this._init();
        }
    }

    offset_sample_points(radius, direction = 0){
        return offset_sample_points(this, radius, direction);
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

    remove(){
        assert.HAS_SKETCH(this);

        this.sketch.remove(this);
    }

    other_endpoint(pt){
        assert.HAS_ENDPOINT(this, pt);

        if (pt instanceof Line) return this.other_endpoint(this.common_endpoint(pt));
        return this.p1 == pt ? this.p2 : this.p1;
    }

    has_endpoint(pt){
        return this.p1 == pt || this.p2 == pt;
    }

    is_deleted(){
        return this.sketch == null;
    }

    set_changed_endpoint(p1, p2){
        if (this.p1 == p1) return this.set_endpoints(p1, p2)
        if (this.p2 == p1) return this.set_endpoints(p2, p1)
        if (this.p1 == p2) return this.set_endpoints(p2, p1)
        if (this.p2 == p2) return this.set_endpoints(p1, p2)
        throw new Error("Both points aren't endpoints of the line");
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

    vec_to_absolute(vec){
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

    orientation(...args){
        assert.HAS_ENDPOINT(this, args[0]);
        args[1] && assert.HAS_ENDPOINT(this, args[1]);

        return 2*(this.same_orientation(...args) - 0.5);
    }

    same_orientation(...args){
        return this.p1 == args[0];
    }

    get_tangent_line(pt){
        return PlainLine.from_direction(pt, this.get_tangent_vector(pt));
    }

    get_tangent_vector(pt){
        // Points along the line in the direction this.p1 -> this.p2, unless we put in this.p1;
        
        const to_absolute = this.get_to_absolute_function();
        if (this.p1.equals(pt)){
            let i = 1;
            while (this.sample_points[i].distance(this.sample_points[0]) < EPS.MEDIUM){
                i++;
            }
            const tangent_inwards = this.p1.subtract(to_absolute(this.sample_points[i])).normalize();
            return this.p1 == pt ? tangent_inwards : tangent_inwards.invert()
        }

        if (this.p2.equals(pt)){
            let i = this.sample_points.length - 1;
            while (this.sample_points[i].distance(this.sample_points[this.sample_points.length - 1]) < EPS.MEDIUM){
                i--;
            }
            return this.p2.subtract(to_absolute(this.sample_points[i])).normalize();
        }

        const pt_rel = this.get_to_relative_function()(pt);
        let min = Infinity;
        let best_index = null;

        for (let i = 0; i < this.sample_points.length - 1; i++){
            const closest_on_line = closest_vec_on_line_segment([
                this.sample_points[i], this.sample_points[i + 1]
            ], pt_rel);
            const dist = closest_on_line.distance(pt_rel);

            if (dist < min){
                min = dist;
                best_index = i;
            }
        }
        
        if (min > EPS.MODERATE) assert.THROW("Vector/Point is not on line.");

        let left = best_index;
        let right = best_index+1;
        while (this.sample_points[left].distance(this.sample_points[right] < EPS.MEDIUM)){
            if (left > 0) left--;
            if (right < this.sample_points.length - 1) right ++;
        }
        return to_absolute(this.sample_points[right].subtract(this.sample_points[left]));
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
        assert.IS_SKETCH_ELEMENT(thing);

        if (thing instanceof Point){
            return thing == this.p1 || thing == this.p2
        }

        return this.common_endpoint(thing) !== null;
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

    rel_normalized_sample_points(k = null) {
        if (k == null){
            const density = CONF.DEFAULT_SAMPLE_POINT_DENSITY;
            k = this.length() / (density * this.endpoint_distance());
        }
        k = Math.round(k);
    
        const total_len = this.get_length() / this.endpoint_distance();
        const step_size = 1 / k;
        const sample_point_distance = total_len * step_size;
    
        const sp = this.sample_points;
        const res = [sp[0]];
    
        let current_sp_index = 0;
        let point_for_distance_from = sp[0]; // Is or is after sp[current_sp_index]
        let distance_left = sample_point_distance;
    
        while (current_sp_index < sp.length - 1) {
            let distance_to_next_sp_point = point_for_distance_from.subtract(sp[current_sp_index + 1]).length();
            if (distance_to_next_sp_point < distance_left) {
                distance_left -= distance_to_next_sp_point;
                current_sp_index += 1;
                point_for_distance_from = sp[current_sp_index];
            } else {
                const next_sample_point = point_for_distance_from.add(
                    sp[current_sp_index + 1].subtract(point_for_distance_from).normalize().mult(distance_left)
                );
    
                point_for_distance_from = next_sample_point;
                res.push(next_sample_point);
                distance_left = sample_point_distance;
            }
        }
    
        if (sp[sp.length - 1].subtract(res[res.length - 1]).length() < sample_point_distance * 0.3) {
            res.pop();
        }
    
        res.push(sp[sp.length - 1]);
    
        return res;
    }
    
    abs_normalized_sample_points(k = null) {
        const to_abs = this.get_to_absolute_function();
        return this.rel_normalized_sample_points(k).map(to_abs);
    }
    

    position_at_length(length, reversed = false){
        const l = this.get_length();
        assert(length <= l, "Specified length longer than line.");

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

                return this.vec_to_absolute(relative_vec);
            }

            sum += next_length;
        }

        assert.INVALID_PATH();
    }

    position_at_fraction(f, reversed = false){
        assert(Math.abs(f) <= 1, "Fraction is not in range [-1,1]");

        f = f >= 0 ? f : 1 - f;
        return this.position_at_length(f * this.length(), reversed);
    }

    vec_at_length(d, reversed = false){
        assert.CALLBACK("Specified length longer than line.", () => {
            return this.endpoint_distance() - Math.abs(d) >= 0
        });

        if (d < 0){
            d *= -1;
            reversed = !reversed;
        }
        if (reversed) d = this.endpoint_distance() - d;
        return this.p1.add(this.get_line_vector().normalize().scale(d));
    }

    vec_at_fraction(f, reversed = false){
        assert(Math.abs(f) <= 1, "Fraction is not in range [-1,1]");

        f = f >= 0 ? f : 1 - f;
        return this.vec_at_length(f * this.endpoint_distance(), reversed);
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

    minimal_distance(vec){
        const p = this.closest_position(vec);
        return p.distance(vec);
    }

    set_sketch(s){
        if (this.sketch == null || s == null){
            this.sketch = s;
            return this;
        }
    }

    _remove_duplicate_points() {
        if (this.sample_points.length <= 2) return;

        let last_index = 0;
        this.sample_points = this.sample_points.filter((point, index) => {
            // Skip the first point, compare each with the previous
            if (index === 0) return true;
            const prevPoint = this.sample_points[last_index];
            if (prevPoint.distance(point) > EPS.WEAK_EQUAL){
                last_index = index;
                return true;
            }
            return false;
        });
    }

    _renormalize(density = null){
        if (!density) density = CONF.DEFAULT_SAMPLE_POINT_DENSITY;

        const n = this.length() / density;
        this.sample_points = this.rel_normalized_sample_points(n);
        return this;
    }

    toString(){
        return "[Line]"
    }

    toJSON(){
        return this.sample_points;
    }
}

add_self_intersection_test(Line);

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
        return this.endpoint_distance();
    }

    position_at_length(f, reversed = false){
        f = f >= 0 ? f : 1 - f;
        return this.vec_at_length(f, reversed);
    }

    position_at_fraction(f, reversed = false){
        f = f >= 0 ? f : 1 - f;
        return this.vec_at_fraction(f, reversed);
    }

    closest_position(vec){
        const rel = this.get_to_relative_function()(vec);
        if (rel.x < 0) return this.p1;
        if (rel.x > 1) return this.p2;
        return this.get_to_absolute_function()(new Vector(rel.x, 0));
    }

    self_intersects(){
        return false;
    }
}

export { StraightLine, Line };
export default Line;