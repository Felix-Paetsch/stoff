import {
    PlainLine,
    Vector,
    affine_transform_from_input_output,
    closest_vec_on_line_segment,
    convex_hull,
    EPS,
    is_convex,
    orientation,
    BoundingBox,
    eps_equal,
} from "./geometry.js";
import Point from "./point.js";
import ConnectedComponent from "./connected_component.js";
import assert from "../assert.js";
import { _calculate_intersections } from "./unicorns/intersect_lines.js";
import offset_sample_points from "./line_methods/offset_sample_points.js";
import add_self_intersection_test from "./unicorns/self_intersects.js";
import SketchElementCollection, { LineSketchElementCollection } from "./sketch_element_collection.js";
import register_line_manipulation_functions from "./line_methods/line_manipulation.js";
import { copy_sketch_element_collection } from "./copy.js";
import Cache from "../utils/cache.js";
import Sketch from "./sketch.js";
import { Color } from "./colors.js";
import { Fraction } from "./geometry/1d.js";
import { SketchElement } from "./types/sketch_elements.js";

type LineAttributes = {
    stroke: Color;
    strokeWidth: number;
    opacity: number;
}

class Line {
    private attributes: LineAttributes = {
        stroke: "rgb(0, 0, 0)",
        strokeWidth: 1,
        opacity: 1,
    }
    public data: any = {};
    private cache: Cache = new Cache();

    // From p1 to p2 rightwards | if we merge lines with opposite orientations, we take the one of the first line
    public right_handed: boolean = true;

    constructor(
        private sketch: Sketch,
        private endpoints: [Point, Point],
        private _sample_points: Vector[],
    ) {
        /*
            Sample points is an array of values [x(t), y(t)] with
            x(t), y(t) relative to the endpoints, t starts at 0 (including it) and goes to 1 (including it)

            I.E. x moves along P1->P2 (with x(0) being P1, x(1) being P2) and y perpendicular in same scale
            There might be exceptions to the above but very hard to deal with!!
        */

        this.cache.new_dependency("endpoints");
        this.cache.new_dependency("sample_points", []);
        this.cache.new_dependency("absolute_sample_points", [
            "endpoints",
            "sample_points",
        ]);

        if (this._sample_points[0].length_squared() < EPS.COARSE) {
            this.sample_points[0] = new Vector(0, 0);
        } else {
            throw new Error("Line sample points dont start with (0,0)");
        }

        if (
            this.sample_points[this.sample_points.length - 1].subtract(new Vector(1, 0)).length_squared() < EPS.COARSE
        ) {
            this.sample_points[this.sample_points.length - 1] = new Vector(
                1, 0
            );
        } else {
            throw new Error("Line sample points dont end with (1,0)");
        }

        this.endpoints[0].add_adjacent_line(this);
        this.endpoints[1].add_adjacent_line(this);

        if (typeof (this as any)._init !== "undefined") {
            (this as any)._init();
        }
    }

    get p1() {
        return this.endpoints[0];
    }
    set p1(p) {
        this.endpoints[0] = p;
        this.cache_update("endpoints");
    }
    get p2() {
        return this.endpoints[1];
    }
    set p2(p) {
        this.endpoints[1] = p;
        this.cache_update("endpoints");
    }
    get sample_points() {
        return this._sample_points;
    }
    set sample_points(points) {
        this._sample_points = points;
        this.cache_update("sample_points");
    }

    cache_update(...what: string[]) {
        this.cache.dependency_changed(...what);
    }

    offset_sample_points(radius: number, withHandedness: boolean = true) {
        return offset_sample_points(
            this.get_absolute_sample_points(),
            radius,
            withHandedness ? this.right_handed : !this.right_handed
        );
    }

    set_endpoints(p1: Point, p2: Point) {
        this.p1.remove_line(this);
        this.p2.remove_line(this);

        this.p1 = p1;
        this.p2 = p2;

        p1.add_adjacent_line(this);
        p2.add_adjacent_line(this);

        return this;
    }

    remove() {
        (assert as any).HAS_SKETCH(this);
        this.sketch.remove(this);
    }

    other_endpoint(pt: SketchElement): Point {
        (assert as any).HAS_ENDPOINT(this, pt);

        if (pt instanceof Line)
            return this.other_endpoint(this.common_endpoint(pt)!);
        return this.p1 == pt ? this.p2 : this.p1;
    }

    endpoint_from_orientation(bool: boolean = true) {
        return bool ? this.p1 : this.p2;
    }

    has_endpoint(pt: Point) {
        return this.p1 == pt || this.p2 == pt;
    }

    is_deleted() {
        return this.sketch == null;
    }

    set_changed_endpoint(p1: Point, p2: Point) {
        if (this.p1 == p1) return this.set_endpoints(p1, p2);
        if (this.p2 == p1) return this.set_endpoints(p2, p1);
        if (this.p1 == p2) return this.set_endpoints(p2, p1);
        if (this.p2 == p2) return this.set_endpoints(p1, p2);
        throw new Error("Both points aren't endpoints of the line");
    }

    replace_endpoint(old_pt: Point, new_pt: Point) {
        if (this.p1 == old_pt) return this.set_endpoints(new_pt, this.p2);
        if (this.p2 == old_pt) return this.set_endpoints(this.p1, new_pt);
        if (this.p1 == new_pt) return this.set_endpoints(old_pt, this.p2);
        if (this.p2 == new_pt) return this.set_endpoints(this.p1, old_pt);
        throw new Error("Neither point was an endpoint of the line");
    }

    set_color(color: Color) {
        this.attributes.stroke = color;
        return this;
    }

    get_color() {
        return this.attributes.stroke;
    }

    set_attribute<K extends keyof LineAttributes>(attr: K, value: LineAttributes[K]) {
        this.attributes[attr] = value;
        return this;
    }

    get_attribute<K extends keyof LineAttributes>(attr: K): LineAttributes[K] {
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

    is_convex(allow_overflow: boolean = false) {
        // The argument says whether the line is also inside the rectangle
        /*
            -----P1--------------
                   *.
                 ..:*
            ---- P2 -------------
        */
        if (!is_convex(this.sample_points)) return false;
        if (allow_overflow) return true;

        const sp = this.sample_points;
        let first_non_zero_sp_index = 0;
        while (
            sp[++first_non_zero_sp_index].distance(sp[0]) < EPS.WEAK_EQUAL
        ) { }

        let last_non_one_sp_index = sp.length - 1;
        while (
            sp[--last_non_one_sp_index].distance(sp[sp.length - 1]) <
            EPS.WEAK_EQUAL
        ) { }

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

    private cut_sample_points_at(
        index_from: number,
        from_percentage_after: Fraction,
        index_to: number,
        to_percentage_after: Fraction
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

    to_relative_position(vec: Vector) {
        return this.get_to_relative_function()(vec);
    }

    get_to_relative_function() {
        return affine_transform_from_input_output(
            [this.p1, this.p2],
            [new Vector(0, 0), new Vector(1, 0)]
        );
    }

    to_absolute_position(vec: Vector) {
        return this.get_to_absolute_function()(vec);
    }

    get_to_absolute_function() {
        return affine_transform_from_input_output(
            [new Vector(0, 0), new Vector(1, 0)],
            [this.p1, this.p2]
        );
    }

    vec_to_absolute(vec: Vector) {
        return this.get_to_absolute_function()(vec);
    }

    get_absolute_sample_points() {
        const r = this.cache.compute_dependent(
            "get_absolute_sample_points",
            ["endpoints", "sample_points"],
            () => {
                const to_absolute = this.get_to_absolute_function();
                return this.sample_points.map((p) => {
                    return to_absolute(p);
                });
            }
        );
        return [...r];
    }

    get_relative_sample_points_from_to(fromFraction: Fraction, toFraction: Fraction): Vector[] {
        if (fromFraction > toFraction)
            return this.get_relative_sample_points_from_to(
                toFraction,
                fromFraction
            );
        let current_len = 0;
        let start;
        let end;
        const length = this.get_length() / this.endpoint_distance();
        for (let i = 1; i < this.sample_points.length; i++) {
            current_len += this.sample_points[i].distance(
                this.sample_points[i - 1]
            );
            if (start === undefined && current_len >= fromFraction * length) {
                start = i;
            }
            if (
                start !== undefined &&
                end === undefined &&
                current_len >= toFraction * length
            ) {
                end = i - 1;
                break;
            }
        }

        const points = this.sample_points.slice(
            start || end || Infinity,
            end || Infinity
        );

        points.push(
            this.to_relative_position(this.position_at_fraction(toFraction))
        );
        points.unshift(
            this.to_relative_position(this.position_at_fraction(fromFraction))
        );
        return points;
    }

    get_absolute_sample_points_from_to(fromFraction: Fraction, toFraction: Fraction): Vector[] {
        const to_absolute = this.get_to_absolute_function();
        return this.get_relative_sample_points_from_to(
            fromFraction,
            toFraction
        ).map((p) => {
            return to_absolute(p);
        });
    }

    get_line_vector() {
        return this.p2.subtract(this.p1);
    }

    get_endpoints(): SketchElementCollection & [Point, Point] {
        return new SketchElementCollection([this.p1, this.p2], this.sketch) as any;
    }

    get_adjacent_lines() {
        return (new SketchElementCollection(
            this.p1.get_lines().concat(this.p2.get_lines()),
            this.sketch
        ) as any).unique()
            .filter((l: Line) => l !== this);
    }

    same_orientation(p1: Point, p2: Point): boolean;
    same_orientation(p: Point): boolean;
    same_orientation(l: Line): boolean;
    same_orientation(...args: any[]) {

        if (args[0] instanceof Line) {
            return (
                args[0].p2 == this.p1 ||
                args[0].p1 == this.p2 ||
                args[0] == this
            );
        }

        (assert as any).HAS_ENDPOINT(this, args[0]);
        args[1] && (assert as any).HAS_ENDPOINT(this, args[1]);
        return this.p1 == args[0];
    }

    same_handedness(line: Line) {
        if (this.same_orientation(line)) {
            return this.right_handed == line.right_handed;
        }

        (assert as any).CALLBACK("Lines dont have common endpoint", () => {
            return !this.common_endpoint(line);
        });
        return this.right_handed != line.right_handed;
    }

    get_tangent_line(pt: Vector | Point) {
        return PlainLine.from_direction(pt, this.get_tangent_vector(pt));
    }

    get_tangent_vector(pt: Vector | Point) {
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
        let best_index: number = 0;

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

        if (min > EPS.MODERATE) (assert as any).THROW("Vector/Point is not on line.");

        let left = best_index;
        let right = best_index + 1;
        while (
            this.sample_points[left].distance_squared(
                this.sample_points[right]
            ) < EPS.FINE_SQUARED
        ) {
            if (left > 0) left--;
            if (right < this.sample_points.length - 1) right++;
        }
        return to_absolute(
            this.sample_points[right].subtract(this.sample_points[left])
        );
    }

    mirror(direction: boolean = false) {
        if (direction) {
            const t = this.p1;
            this.p1 = this.p2;
            this.p2 = t;
            this.swap_orientation();
            // This performs double mirror
        }
        this.right_handed = !this.right_handed;
        this.sample_points.forEach((p) => p.set(p.x, -p.y));
        this.cache_update("sample_points");
        return this;
    }

    set_orientation(p1: Point, p2?: Point) {
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
        this.cache_update("sample_points");
        this.right_handed = !this.right_handed;

        return this;
    }

    swap_handedness() {
        this.right_handed = !this.right_handed;
        return this;
    }

    set_handedness(cmpr: boolean | Line | Vector): boolean {
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
                this.p1,
                this.p2,
                cmpr
            ));
        }

        return (assert as any).INVALID_PATH();
    }

    stretch(factor = 1) {
        this.sample_points.forEach((p) => p.set(p.x, factor * p.y));
        this.cache_update("sample_points");
        return this;
    }

    endpoint_distance() {
        return this.p1.distance(this.p2);
    }

    get_length() {
        return this.cache.compute_dependent(
            "get_length",
            ["endpoints", "sample_points"],
            () => {
                const endpoint_distance = this.endpoint_distance();
                let sum = 0;

                for (let i = 0; i < this.sample_points.length - 1; i++) {
                    sum += Math.sqrt(
                        Math.pow(
                            this.sample_points[i].y -
                            this.sample_points[i + 1].y,
                            2
                        ) +
                        Math.pow(
                            this.sample_points[i].x -
                            this.sample_points[i + 1].x,
                            2
                        )
                    );
                }

                return sum * endpoint_distance;
            }
        );
    }

    get_bounding_box() {
        return this.cache.compute_dependent(
            "bounding_box",
            ["absolute_sample_points"],
            () => {
                return BoundingBox.from_points(
                    this.get_absolute_sample_points()
                );
            }
        );
    }

    convex_hull() {
        return this.cache.compute_dependent(
            "convex_hull",
            ["absolute_sample_points"],
            () => {
                return convex_hull(this.get_absolute_sample_points());
            }
        );
    }

    is_adjacent(thing: SketchElement) {
        (assert as any).IS_SKETCH_ELEMENT(thing);

        if (thing instanceof Point) {
            return thing == this.p1 || thing == this.p2;
        }

        return this.common_endpoint(thing) !== null;
    }

    common_endpoint(line: Line) {
        if (this.p1 == line.p1 || this.p1 == line.p2) {
            return this.p1;
        }
        if (this.p2 == line.p1 || this.p2 == line.p2) {
            return this.p2;
        }

        return null;
    }

    position_at_length(length: number, reversed = false) {
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
            let START_I = i;
            let next_length = 0;
            while (true) {
                next_length = this.sample_points[i + 1].distance(
                    this.sample_points[START_I]
                );
                if (next_length > EPS.FINE) {
                    break;
                }
                if (i + 1 < this.sample_points.length) {
                    i++;
                } else {
                    START_I--;
                }
            }

            if (
                sum <= adjusted_length + EPS.COARSE &&
                sum + next_length >= adjusted_length - EPS.COARSE
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

        return (assert as any).INVALID_PATH();
    }

    position_at_fraction(f: number, reversed = false) {
        assert(Math.abs(f) <= 1, "Fraction is not in range [-1,1]");

        f = f >= 0 ? f : 1 - f;
        return this.position_at_length(f * this.get_length(), reversed);
    }

    closest_position(vec: Vector) {
        const vec_rel = this.get_to_relative_function()(vec);

        let min: number = Infinity;
        let best: Vector = new Vector(0, 0);

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

    minimal_distance(vec: Vector) {
        const p = this.closest_position(vec);
        return p.distance(vec);
    }

    set_sketch(s: Sketch) {
        this.sketch = s;
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

    paste_to_sketch(target: Sketch, position: Vector | null = null) {
        const res = copy_sketch_element_collection(this, target, position);
        return res.get_corresponding_sketch_element(this);
    }

    static order_by_endpoints(...lines: Line[]): LineSketchElementCollection & {
        orientations: boolean[], points: Point[]
    } {
        if (Array.isArray(lines[0])) {
            lines = [...lines[0]];
        }
        if (lines.length == 0) {
            const r = new SketchElementCollection([]);
            (r as any).orientations = [];
            (r as any).points = [];
            return r as any;
        }
        if (lines.length == 1) {
            lines = new SketchElementCollection(lines, lines[0].get_sketch()) as any;
            (lines as any).orientations = true;
            (lines as any).points = lines[0].get_endpoints();
            return lines as any;
        };
        if (lines.length == 2) return set_two_line_orientations(lines);

        const res: LineSketchElementCollection & { orientations: boolean[], points: Point[] } = new SketchElementCollection([], lines[0].get_sketch()) as any;
        res.push(lines.pop()!);
        res.orientations = [true];
        res.points = [res[0].p1, res[0].p2];

        let smth_found: boolean = false;
        while (lines.length > 0) {
            for (let i = lines.length - 1; i >= 0; i--) {
                if (res[0].common_endpoint(lines[i])) {
                    // Prepend
                    smth_found = true;
                    res.unshift(...lines.splice(i, 1));
                    if (res.length == 2) {
                        set_two_line_orientations(res);
                    } else {
                        const next_orientation = res.orientations[0];
                        res.orientations.unshift(
                            res[1][next_orientation ? "p1" : "p2"] == res[0].p2
                        );
                        res.points.unshift(
                            res[0].other_endpoint(res.points[0])
                        );
                    }
                } else if (res[res.length - 1].common_endpoint(lines[i])) {
                    // Append
                    smth_found = true;
                    res.push(...lines.splice(i, 1));
                    if (res.length == 2) {
                        set_two_line_orientations(res);
                    } else {
                        const prev_orientation =
                            res.orientations[res.orientations.length - 1];
                        res.orientations.push(
                            res[res.length - 2][
                            prev_orientation ? "p2" : "p1"
                            ] == res[res.length - 1].p1
                        );
                        res.points.push(
                            res[res.length - 1].other_endpoint(
                                res.points[res.points.length - 1]
                            )
                        );
                    }
                }
            }

            if (!smth_found)
                throw new Error("Lines dont form a connected segment");
        }

        function set_two_line_orientations(lines: any) {
            if (lines[1].has_endpoint(lines[0].p2)) {
                lines.orientations = [true, lines[1].p1 == lines[0].p2];
                lines.points = [
                    lines[0].p1,
                    lines[0].p2,
                    lines[1].other_endpoint(lines[0].p2),
                ];
            } else if (lines[1].has_endpoint(lines[0].p1)) {
                lines.orientations = [false, lines[1].p1 == lines[0].p1];
                lines.points = [
                    lines[0].p2,
                    lines[0].p1,
                    lines[1].other_endpoint(lines[0].p1),
                ];
            } else throw new Error("Lines dont form a connected segment");
            return lines;
        }

        return res;
    }

    static straight(sketch: Sketch, endpoints: [Point, Point]) {
        return new Line(sketch, endpoints, [
            new Vector(0, 0),
            new Vector(1, 0),
        ]);
    }
}

add_self_intersection_test(Line);
register_line_manipulation_functions(Line);

export default Line;
