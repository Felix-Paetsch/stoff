import {
    PlainLine,
    Vector,
    affine_transform_from_input_output,
    closest_vec_on_line_segment,
    convex_hull,
    EPS,
    is_convex,
    orientation,
} from "./geometry.js";
import Point from "./point.js";
import ConnectedComponent from "./connected_component.js";
import assert from "../assert.js";
import { _calculate_intersections } from "./unicorns/intersect_lines.js";
import offset_sample_points from "./line_methods/offset_sample_points.js";
import add_self_intersection_test from "./unicorns/self_intersects.js";
import CONF from "./config.json" with { type: "json" };
import SketchElementCollection from "./sketch_element_collection.js";
import register_line_manipulation_functions from "./line_methods/line_manipulation.js";
import { copy_sketch_element_collection } from "./copy.js";

class Line {
    constructor(endpoint_1, endpoint_2, sample_points) {
        /*
            Sample points is an array of values [x(t), y(t)] with
            x(t), y(t) relative to the endpoints, t starts at 0 (including it) and goes to 1 (including it)

            I.E. x moves along P1->P2 (with x(0) being P1, x(1) being P2) and y perpendicular in same scale
            There might be exceptions to the above but very hard to deal with!!
        */

        this.attributes = {
            stroke: "rgb(0, 0, 0)",
            strokeWidth: 1,
            opacity: 1,
        };
        this.data = {};
        this.sketch = null;

        this.p1 = endpoint_1;
        this.p2 = endpoint_2;
        this.right_handed = true;
        // From p1 to p2 rightwards | if we merge lines with opposite orientations, we take the one of the first line

        /*
        
            Todo: 
            Check if two lines hitting at a point have same primary orientiation
            Swap primary orth orientation (then also perhaps swapping it in attributes; or a helper maybe to swap it, also swapping it in attributes)
            Get primary orientations in a circle
            Get matching consecutive primary orientations
            Assign correct orientation at when splitting/merging
            Make some methods orientation dependent (like getting the orthogonal vector)

        */

        this.sample_points = sample_points;
        this.self_intersection_cache = {
            sp: null,
            self_intersects: null,
        };

        function approx_eq(v1, v2) {
            return v1.subtract(v2).length_squared() < 0.01;
        }

        if (approx_eq(this.sample_points[0], new Vector(0, 0))) {
            this.sample_points[0] = new Vector(0, 0);
        } else {
            throw new Error("Line sample points dont start with (0,0)");
        }

        if (
            approx_eq(
                this.sample_points[this.sample_points.length - 1],
                new Vector(1, 0)
            )
        ) {
            this.sample_points[this.sample_points.length - 1] = new Vector(
                1,
                0
            );
        } else {
            throw new Error("Line sample points dont end with (1,0)");
        }

        endpoint_1.add_adjacent_line(this);
        endpoint_2.add_adjacent_line(this);

        if (typeof this._init !== "undefined") {
            this._init();
        }
    }

    offset_sample_points(radius, direction = 0) {
        return offset_sample_points(
            this,
            radius,
            Boolean(!direction) ^ Boolean(this.right_handed)
        );
    }

    set_endpoints(p1, p2) {
        this.p1.remove_line(this);
        this.p2.remove_line(this);

        this.p1 = p1;
        this.p2 = p2;

        p1.add_adjacent_line(this);
        p2.add_adjacent_line(this);

        return this;
    }

    remove() {
        assert.HAS_SKETCH(this);

        this.sketch.remove(this);
    }

    other_endpoint(pt) {
        assert.HAS_ENDPOINT(this, pt);

        if (pt instanceof Line)
            return this.other_endpoint(this.common_endpoint(pt));
        return this.p1 == pt ? this.p2 : this.p1;
    }

    endpoint_from_orientation(bool = true) {
        return bool ? this.p1 : this.p2;
    }

    has_endpoint(pt) {
        return this.p1 == pt || this.p2 == pt;
    }

    is_deleted() {
        return this.sketch == null;
    }

    set_changed_endpoint(p1, p2) {
        if (this.p1 == p1) return this.set_endpoints(p1, p2);
        if (this.p2 == p1) return this.set_endpoints(p2, p1);
        if (this.p1 == p2) return this.set_endpoints(p2, p1);
        if (this.p2 == p2) return this.set_endpoints(p1, p2);
        throw new Error("Both points aren't endpoints of the line");
    }

    replace_endpoint(old_pt, new_pt) {
        if (this.p1 == old_pt) return this.set_endpoints(new_pt, this.p2);
        if (this.p2 == old_pt) return this.set_endpoints(this.p1, new_pt);
        if (this.p1 == new_pt) return this.set_endpoints(old_pt, this.p2);
        if (this.p2 == new_pt) return this.set_endpoints(this.p1, old_pt);
        throw new Error("Neither point was an endpoint of the line");
    }

    set_color(color) {
        this.attributes.stroke = color;
        return this;
    }

    get_color() {
        return this.attributes.stroke;
    }

    set_attribute(attr, value) {
        this.attributes[attr] = value;
        return this;
    }

    get_attribute(attr) {
        return this.attributes[attr];
    }

    get_sample_points() {
        return this.sample_points;
    }

    get_sketch() {
        return this.sketch;
    }

    is_straight() {
        return !this.sample_points.some((p) => p.y !== 0);
    }

    convert_to_straight_line() {
        if (!this.is_straight()) return false;

        Object.setPrototypeOf(this, StraightLine.prototype);
        this.constructor = StraightLine; // Change constructor reference

        const density =
            this.sample_points.length > 1
                ? 1 / (this.sample_points.length - 1)
                : CONF.DEFAULT_SAMPLE_POINT_DENSITY;

        const n = Math.ceil(1 / density);
        this.sample_points = Array.from(
            { length: n + 1 },
            (_v, i) => new Vector(i / n, 0)
        );

        return this;
    }

    is_convex(allow_overflow = false) {
        if (!is_convex(this.same_orientation)) return false;
        if (allow_overflow) return true;

        const sp = this.sample_points;
        let first_non_zero_sp_index = 0;
        while (
            sp[++first_non_zero_sp_index].distance(sp[0]) < EPS.WEAK_EQUAL
        ) {}

        let last_non_one_sp_index = sp.length - 1;
        while (
            sp[--last_non_one_sp_index].distance(sp[sp.length - 1]) <
            EPS.WEAK_EQUAL
        ) {}

        return (
            sp[first_non_zero_sp_index].x >= -EPS.MINY &&
            sp[last_non_one_sp_index].x <= 1 + EPS.MINY
        );
    }

    connected_component() {
        return new ConnectedComponent(this);
    }

    copy_sample_points() {
        return this.sample_points.map((v) => new Vector(v));
    }

    cut_sample_points_at(
        index_from,
        from_percentage_after,
        index_to,
        to_percentage_after
    ) {
        const cut_sample_points = this.sample_points.slice(
            index_from,
            index_to + 2
        ); // One after last one included if needed interpolation

        if (from_percentage_after > 0) {
            cut_sample_points[0] = cut_sample_points[0]
                .mult(1 - from_percentage_after)
                .add(cut_sample_points[1].mult(from_percentage_after));
        }

        if (
            to_percentage_after == 0 &&
            !(index_to + 1 == this.sample_points.length)
        ) {
            cut_sample_points.pop();
        } else if (to_percentage_after == 0) {
        } else {
            const l = cut_sample_points.length - 1;
            cut_sample_points[l] = cut_sample_points[l - 1]
                .mult(1 - to_percentage_after)
                .add(cut_sample_points[l].mult(to_percentage_after));
        }

        const transform_func = affine_transform_from_input_output(
            [
                cut_sample_points[0],
                cut_sample_points[cut_sample_points.length - 1],
            ],
            [new Vector(0, 0), new Vector(1, 0)]
        );

        const res = cut_sample_points.map((p) => transform_func(p));
        return res;
    }

    get_to_relative_function() {
        return affine_transform_from_input_output(
            [this.p1, this.p2],
            [new Vector(0, 0), new Vector(1, 0)]
        );
    }

    get_to_absolute_function() {
        return affine_transform_from_input_output(
            [new Vector(0, 0), new Vector(1, 0)],
            [this.p1, this.p2]
        );
    }

    vec_to_absolute(vec) {
        return this.get_to_absolute_function()(vec);
    }

    get_absolute_sample_points() {
        const to_absolute = this.get_to_absolute_function();
        return this.sample_points.map((p) => {
            return to_absolute(p);
        });
    }

    get_line_vector() {
        return this.p2.subtract(this.p1);
    }

    get_endpoints() {
        return new SketchElementCollection([this.p1, this.p2], this.sketch);
    }

    get_adjacent_lines() {
        return new SketchElementCollection(
            this.p1.get_lines().concat(this.p2.get_lines()),
            this.sketch
        )
            .unique()
            .filter((l) => l !== this);
    }

    orientation(...args) {
        return !!(2 * (this.same_orientation(...args) - 0.5));
    }

    same_orientation(...args) {
        if (args[0] instanceof Line) {
            return (
                args[0].p2 == this.p1 ||
                args[0].p1 == this.p2 ||
                args[0] == this
            );
        }

        assert.HAS_ENDPOINT(this, args[0]);
        args[1] && assert.HAS_ENDPOINT(this, args[1]);
        return this.p1 == args[0];
    }

    same_handedness(line) {
        if (this.same_orientation(line)) {
            return this.right_handed == line.right_handed;
        }

        assert.CALLBACK("Lines dont have common endpoint", () => {
            return !this.common_endpoint(line);
        });
        return this.right_handed != line.right_handed;
    }

    get_tangent_line(pt) {
        return PlainLine.from_direction(pt, this.get_tangent_vector(pt));
    }

    get_tangent_vector(pt) {
        // Points along the line in the direction this.p1 -> this.p2, unless we put in this.p1;

        const to_absolute = this.get_to_absolute_function();
        if (this.p1.equals(pt)) {
            let i = 1;
            while (
                this.sample_points[i].distance(this.sample_points[0]) <
                EPS.MEDIUM
            ) {
                i++;
            }
            const tangent_inwards = this.p1
                .subtract(to_absolute(this.sample_points[i]))
                .normalize();
            return this.p1 == pt ? tangent_inwards : tangent_inwards.invert();
        }

        if (this.p2.equals(pt)) {
            let i = this.sample_points.length - 1;
            while (
                this.sample_points[i].distance(
                    this.sample_points[this.sample_points.length - 1]
                ) < EPS.MEDIUM
            ) {
                i--;
            }
            return this.p2
                .subtract(to_absolute(this.sample_points[i]))
                .normalize();
        }

        const pt_rel = this.get_to_relative_function()(pt);
        let min = Infinity;
        let best_index = null;

        for (let i = 0; i < this.sample_points.length - 1; i++) {
            const closest_on_line = closest_vec_on_line_segment(
                [this.sample_points[i], this.sample_points[i + 1]],
                pt_rel
            );
            const dist = closest_on_line.distance(pt_rel);

            if (dist < min) {
                min = dist;
                best_index = i;
            }
        }

        if (min > EPS.MODERATE) assert.THROW("Vector/Point is not on line.");

        let left = best_index;
        let right = best_index + 1;
        while (
            this.sample_points[left].distance(
                this.sample_points[right] < EPS.MEDIUM
            )
        ) {
            if (left > 0) left--;
            if (right < this.sample_points.length - 1) right++;
        }
        return to_absolute(
            this.sample_points[right].subtract(this.sample_points[left])
        );
    }

    mirror(direction = false) {
        if (direction) {
            const t = this.p1;
            this.p1 = this.p2;
            this.p2 = t;
            this.swap_orientation();
            // This performs double mirror
        }
        this.right_handed = !this.right_handed;
        this.sample_points.forEach((p) => p.set(p.x, -p.y));
        return this;
    }

    set_orientation(p1, p2 = null) {
        if (p1 == this.p2) {
            this.swap_orientation();
        }

        return this;
    }

    swap_orientation() {
        const t = this.p1;
        this.p1 = this.p2;
        this.p2 = t;
        this.sample_points.reverse();
        this.sample_points.forEach((p) => p.set(1 - p.x, -p.y));
        this.right_handed = !this.right_handed;

        return this;
    }

    swap_handedness() {
        this.right_handed = !this.right_handed;
        return this;
    }

    set_handedness(cmpr) {
        if (typeof cmpr == "boolean") {
            return (this.right_handed = cmpr);
        }

        if (cmpr instanceof Line) {
            if (this.same_handedness(cmpr)) {
                return this.right_handed;
            }

            return (this.right_handed = !this.right_handed);
        }

        if (cmpr instanceof Vector) {
            return (this.right_handed = !orientation(
                ...this.get_endpoints(),
                cmpr
            ));
        }

        assert.INVALID_PATH();
    }

    stretch(factor = 1) {
        this.sample_points.forEach((p) => p.set(p.x, factor * p.y));
        return this;
    }

    endpoint_distance() {
        return this.p1.distance(this.p2);
    }

    get_length() {
        const endpoint_distance = this.endpoint_distance();
        let sum = 0;

        for (let i = 0; i < this.sample_points.length - 1; i++) {
            sum += Math.sqrt(
                Math.pow(
                    this.sample_points[i][1] - this.sample_points[i + 1][1],
                    2
                ) +
                    Math.pow(
                        this.sample_points[i][0] - this.sample_points[i + 1][0],
                        2
                    )
            );
        }

        return sum * endpoint_distance;
    }

    get_bounding_box() {
        let _min_x = Infinity;
        let _min_y = Infinity;
        let _max_x = -Infinity;
        let _max_y = -Infinity;

        this.get_absolute_sample_points().forEach((p) => {
            _min_x = Math.min(p.x, _min_x);
            _max_x = Math.max(p.x, _max_x);
            _min_y = Math.min(p.y, _min_y);
            _max_y = Math.max(p.y, _max_y);
        });

        return {
            width: _max_x - _min_x,
            height: _max_y - _min_y,
            top_left: new Vector(_min_x, _min_y),
            top_right: new Vector(_max_x, _min_y),
            bottom_left: new Vector(_min_x, _max_y),
            bottom_right: new Vector(_max_x, _max_y),
        };
    }

    convex_hull() {
        return convex_hull(this.get_absolute_sample_points());
    }

    is_adjacent(thing) {
        assert.IS_SKETCH_ELEMENT(thing);

        if (thing instanceof Point) {
            return thing == this.p1 || thing == this.p2;
        }

        return this.common_endpoint(thing) !== null;
    }

    common_endpoint(line) {
        if (this.p1 == line.p1 || this.p1 == line.p2) {
            return this.p1;
        }
        if (this.p2 == line.p1 || this.p2 == line.p2) {
            return this.p2;
        }

        return null;
    }

    position_at_length(length, reversed = false) {
        const l = this.get_length();
        length = length >= 0 ? length : l - length;
        assert(length <= l, "Specified length longer than line.");

        if (reversed) {
            length = l - length;
        }

        const endpoint_distance = this.endpoint_distance();
        const adjusted_length = length / endpoint_distance;

        let sum = 0;
        for (let i = 0; i < this.sample_points.length - 1; i++) {
            const next_length = Math.sqrt(
                Math.pow(
                    this.sample_points[i][1] - this.sample_points[i + 1][1],
                    2
                ) +
                    Math.pow(
                        this.sample_points[i][0] - this.sample_points[i + 1][0],
                        2
                    )
            );

            if (
                sum <= adjusted_length &&
                sum + next_length >= adjusted_length
            ) {
                const left_to_walk = adjusted_length - sum;
                const fraction_left = left_to_walk / next_length;

                const relative_vec = this.sample_points[i]
                    .mult(1 - fraction_left)
                    .add(this.sample_points[i + 1].mult(fraction_left));

                return this.vec_to_absolute(relative_vec);
            }

            sum += next_length;
        }

        assert.INVALID_PATH();
    }

    position_at_fraction(f, reversed = false) {
        assert(Math.abs(f) <= 1, "Fraction is not in range [-1,1]");

        f = f >= 0 ? f : 1 - f;
        return this.position_at_length(f * this.get_length(), reversed);
    }

    closest_position(vec) {
        const vec_rel = this.get_to_relative_function()(vec);

        let min = Infinity;
        let best = null;

        for (let i = 0; i < this.sample_points.length - 1; i++) {
            const closest_on_line = closest_vec_on_line_segment(
                [this.sample_points[i], this.sample_points[i + 1]],
                vec_rel
            );
            const dist = closest_on_line.distance(vec_rel);

            if (dist < min) {
                min = dist;
                best = closest_on_line;
            }
        }

        return this.get_to_absolute_function()(best);
    }

    minimal_distance(vec) {
        const p = this.closest_position(vec);
        return p.distance(vec);
    }

    set_sketch(s) {
        if (this.sketch == null || s == null) {
            this.sketch = s;
        }
        return this;
    }

    toString() {
        return "[Line]";
    }

    toJSON() {
        return {
            p1: this.p1.toJSON(),
            p2: this.p2.toJSON(),
            sample_points: this.sample_points,
        };
    }

    paste_to_sketch(target, position = null) {
        const res = copy_sketch_element_collection(this, target, position);
        return res.get_corresponding_sketch_element(this);
    }
}

add_self_intersection_test(Line);
register_line_manipulation_functions(Line);

class StraightLine extends Line {
    constructor(
        endpoint_1,
        endpoint_2,
        density = CONF.DEFAULT_SAMPLE_POINT_DENSITY
    ) {
        const n = Math.ceil(1 / density);

        super(
            endpoint_1,
            endpoint_2,
            Array.from({ length: n + 1 }, (_v, i) => new Vector(i / n, 0))
        );
    }

    get_length() {
        return this.endpoint_distance();
    }

    position_at_length(d, reversed = false) {
        assert.CALLBACK("Specified length longer than line.", () => {
            return this.endpoint_distance() - Math.abs(d) >= 0;
        });

        if (d < 0) {
            d = -d;
            reversed = !reversed;
        }

        if (reversed) {
            d = this.endpoint_distance() - d;
        }

        return this.p1.add(this.get_line_vector().normalize().scale(d));
    }

    position_at_fraction(f, reversed = false) {
        assert(Math.abs(f) <= 1, "Fraction is not in range [-1,1]");
        return this.position_at_length(this.get_length() * f, reversed);
    }

    closest_position(vec) {
        const rel = this.get_to_relative_function()(vec);
        if (rel.x < 0) return this.p1;
        if (rel.x > 1) return this.p2;
        return this.get_to_absolute_function()(new Vector(rel.x, 0));
    }

    self_intersects() {
        return false;
    }

    smooth_out() {
        return this;
    }
}

export { StraightLine, Line };
export default Line;
