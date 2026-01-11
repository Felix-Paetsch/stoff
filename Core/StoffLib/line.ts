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
    polygon_orientation
} from "./geometry";
import { Point } from "./point";
import { ConnectedComponent } from "./connected_component";
import { assert } from "../assert";
import { _calculate_intersections } from "./unicorns/intersect_lines";
import { offset_sample_points } from "./line_methods/offset_sample_points";
import * as LineManipulation from "./line_methods/line_manipulation";
import { copy_sketch_element_collection } from "./copy";
import { Cache } from "../utils/cache";
import { Sketch } from "./sketch";
import { Color } from "./colors";
import { Fraction } from "./geometry/1d";
import { SketchElement, SketchElementData } from "./types";
import { self_intersects } from "./unicorns/self_intersects";
import * as SketchElementCollectionMethods from "./collection";
import { invalid_path } from "./assert_methods/exports";

type LineAttributes = {
    stroke: Color;
    strokeWidth: number;
    opacity: number;
}

export class Line {
    public attributes: LineAttributes = {
        stroke: "rgb(0, 0, 0)",
        strokeWidth: 1,
        opacity: 1,
    }
    public data: SketchElementData = {};
    private cache: Cache = new Cache();

    // From p1 to p2 rightwards | if we merge lines with opposite orientations, we take the one of the first line
    public right_handed: boolean = true;
    private _is_removed = false;

    constructor(
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
            assert(invalid_path("Line sample points dont start with (1,0)"));
        }

        if (
            this.sample_points[this.sample_points.length - 1].subtract(new Vector(1, 0)).length_squared() < EPS.COARSE
        ) {
            this.sample_points[this.sample_points.length - 1] = new Vector(
                1, 0
            );
        } else {
            assert(invalid_path("Line sample points dont end with (1,0)"));
        }

        this.endpoints[0].__register_line(this);
        this.endpoints[1].__register_line(this);
        this.get_sketch().__register_line(this);

        assert(this.endpoints[0].get_sketch() === this.endpoints[1].get_sketch());
        assert(this.endpoints[0].get_sketch() === this.endpoints[1].get_sketch());
    }

    get is_removed() {
        return this._is_removed;
    }

    get_sketch() {
        assert(!this._is_removed, "Line is removed");
        return this.p1.get_sketch();
    }

    get p1() {
        assert(!this._is_removed, "Line is removed");
        return this.endpoints[0];
    }
    set p1(p) {
        assert(!this._is_removed, "Line is removed");
        this.endpoints[0] = p;
        this.cache_update("endpoints");
    }
    get p2() {
        assert(!this._is_removed, "Line is removed");
        return this.endpoints[1];
    }
    set p2(p) {
        assert(!this._is_removed, "Line is removed");
        this.endpoints[1] = p;
        this.cache_update("endpoints");
    }
    get sample_points() {
        return this._sample_points;
    }
    set sample_points(points) {
        assert(!this._is_removed, "Line is removed");
        this._sample_points = points;
        this.cache_update("sample_points");
    }

    cache_update(...what: string[]) {
        assert(!this._is_removed, "Line is removed");
        this.cache.dependency_changed(...what);
    }

    offset_sample_points(radius: number, withHandedness: boolean = true) {
        assert(!this._is_removed, "Line is removed");
        return offset_sample_points(
            this.get_absolute_sample_points(),
            radius,
            withHandedness ? this.right_handed : !this.right_handed
        );
    }

    set_endpoints(p1: Point, p2: Point) {
        assert(!this._is_removed, "Line is removed");
        this.p1.__unregister_line(this);
        this.p2.__unregister_line(this);

        this.p1 = p1;
        this.p2 = p2;

        p1.__register_line(this);
        p2.__register_line(this);

        return this;
    }

    remove() {
        assert(!this._is_removed, "Line is already removed");
        this.p1.__unregister_line(this);
        this.p2.__unregister_line(this);
        this.get_sketch().__unregister_line(this);
        this._is_removed = true;
    }

    other_endpoint(pt: SketchElement): Point {
        assert(this.is_adjacent(pt));
        assert(!this._is_removed, "Line is removed");

        if (pt instanceof Line)
            return this.other_endpoint(this.common_endpoint(pt)!);
        return this.p1 == pt ? this.p2 : this.p1;
    }

    endpoint_from_orientation(bool: boolean = true) {
        assert(!this._is_removed, "Line is removed");
        return bool ? this.p1 : this.p2;
    }

    has_endpoint(pt: Point) {
        assert(!this._is_removed, "Line is removed");
        return this.p1 == pt || this.p2 == pt;
    }

    set_changed_endpoint(p1: Point, p2: Point) {
        assert(!this._is_removed, "Line is removed");
        if (this.p1 == p1) return this.set_endpoints(p1, p2);
        if (this.p2 == p1) return this.set_endpoints(p2, p1);
        if (this.p1 == p2) return this.set_endpoints(p2, p1);
        if (this.p2 == p2) return this.set_endpoints(p1, p2);
        assert(invalid_path(),);
    }

    replace_endpoint(old_pt: Point, new_pt: Point) {
        assert(!this._is_removed, "Line is removed");
        if (this.p1 == old_pt) return this.set_endpoints(new_pt, this.p2);
        if (this.p2 == old_pt) return this.set_endpoints(this.p1, new_pt);
        if (this.p1 == new_pt) return this.set_endpoints(old_pt, this.p2);
        if (this.p2 == new_pt) return this.set_endpoints(this.p1, old_pt);
        assert(invalid_path("Both endpoints dont belong to line"));
    }

    set_color(color: Color) {
        assert(!this._is_removed, "Line is removed");
        this.attributes.stroke = color;
        return this;
    }

    get_color() {
        assert(!this._is_removed, "Line is removed");
        return this.attributes.stroke;
    }

    set_attribute<K extends keyof LineAttributes>(attr: K, value: LineAttributes[K]) {
        assert(!this._is_removed, "Line is removed");
        this.attributes[attr] = value;
        return this;
    }

    get_attribute<K extends keyof LineAttributes>(attr: K): LineAttributes[K] {
        assert(!this._is_removed, "Line is removed");
        return this.attributes[attr];
    }

    get_attributes(): LineAttributes {
        assert(!this._is_removed, "Line is removed");
        return {
            ...this.attributes,
        };
    }

    set_attributes(attrs: Partial<LineAttributes>) {
        assert(!this._is_removed, "Line is removed");
        this.attributes = {
            ...this.attributes,
            ...attrs,
        };
        return this;
    }

    get_sample_points() {
        return this.sample_points;
    }

    is_straight() {
        assert(!this._is_removed, "Line is removed");
        return !this.sample_points.some((p) => p.y !== 0);
    }

    is_convex(allow_overflow: boolean = false) {
        assert(!this._is_removed, "Line is removed");
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
        assert(!this._is_removed, "Line is removed");
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

    get_endpoints(): [Point, Point] {
        assert(!this._is_removed, "Line is removed");
        return [this.p1, this.p2];
    }

    get_adjacent_lines() {
        assert(!this._is_removed, "Line is removed");
        return SketchElementCollectionMethods.unique(
            this.p1.get_adjacent_lines().concat(this.p2.get_adjacent_lines())
        ).filter((l: Line) => l !== this);
    }

    same_orientation(p1: Point, p2: Point): boolean;
    same_orientation(p: Point): boolean;
    same_orientation(l: Line): boolean;
    same_orientation(...args: any[]) {
        assert(!this._is_removed, "Line is removed");

        if (args[0] instanceof Line) {
            return (
                args[0].p2 == this.p1 ||
                args[0].p1 == this.p2 ||
                args[0] == this
            );
        }

        assert(this.has_endpoint(args[0]))
        assert(!args[1] || this.has_endpoint(args[1]))
        return this.p1 == args[0];
    }

    same_handedness(line: Line) {
        assert(!this._is_removed, "Line is removed");
        if (this.same_orientation(line)) {
            return this.right_handed == line.right_handed;
        }

        assert(!!this.common_endpoint(line), "Lines dont have common endpoint");
        return this.right_handed != line.right_handed;
    }

    get_tangent_line(pt: Vector | Point) {
        assert(!this._is_removed, "Line is removed");
        return PlainLine.from_direction(pt, this.get_tangent_vector(pt));
    }

    get_tangent_vector(pt: Vector | Point) {
        assert(!this._is_removed, "Line is removed");
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

        assert(min < EPS.MODERATE, "Vector/Point is not on line.");

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
        assert(!this._is_removed, "Line is removed");
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
        assert(!this._is_removed, "Line is removed");
        assert(this.endpoints.includes(p1), "Point isnt endpoint of line.");
        assert(!p2 || this.endpoints.includes(p2), "Point isnt endpoint of line.");

        if (p1 == this.p2) {
            this.swap_orientation();
        }

        return this;
    }

    swap_orientation() {
        assert(!this._is_removed, "Line is removed");
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
        assert(!this._is_removed, "Line is removed");
        this.right_handed = !this.right_handed;
        return this;
    }

    set_handedness(cmpr: boolean | Line | Vector): boolean {
        assert(!this._is_removed, "Line is removed");
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

        return assert(invalid_path());
    }

    stretch(factor = 1) {
        assert(!this._is_removed, "Line is removed");
        this.sample_points.forEach((p) => p.set(p.x, factor * p.y));
        this.cache_update("sample_points");
        return this;
    }

    endpoint_distance() {
        assert(!this._is_removed, "Line is removed");
        return this.p1.distance(this.p2);
    }

    get_length() {
        assert(!this._is_removed, "Line is removed");
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
        assert(!this._is_removed, "Line is removed");
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
        assert(!this._is_removed, "Line is removed");
        return this.cache.compute_dependent(
            "convex_hull",
            ["absolute_sample_points"],
            () => {
                return convex_hull(this.get_absolute_sample_points());
            }
        );
    }

    is_adjacent(thing: SketchElement) {
        assert(!this._is_removed, "Line is removed");

        if (thing instanceof Point) {
            return thing == this.p1 || thing == this.p2;
        }

        return this.common_endpoint(thing) !== null;
    }

    common_endpoint(line: Line) {
        assert(!this._is_removed, "Line is removed");
        if (this.p1 == line.p1 || this.p1 == line.p2) {
            return this.p1;
        }
        if (this.p2 == line.p1 || this.p2 == line.p2) {
            return this.p2;
        }

        return null;
    }

    position_at_length(length: number, reversed = false): Vector {
        assert(!this._is_removed, "Line is removed");
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

        throw assert(invalid_path());
    }

    position_at_fraction(f: number, reversed = false) {
        assert(!this._is_removed, "Line is removed");
        assert(Math.abs(f) <= 1, "Fraction is not in range [-1,1]");

        f = f >= 0 ? f : 1 - f;
        return this.position_at_length(f * this.get_length(), reversed);
    }

    closest_position(vec: Vector) {
        assert(!this._is_removed, "Line is removed");
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
        assert(!this._is_removed, "Line is removed");
        const p = this.closest_position(vec);
        return p.distance(vec);
    }

    toString() {
        return "[Line]" as const;
    }

    toJSON() {
        return {
            p1: this.p1.toJSON(),
            p2: this.p2.toJSON(),
            sample_points: this.sample_points,
        };
    }

    paste_to_sketch(target: Sketch, position: Vector | null = null) {
        assert(!this._is_removed, "Line is removed");
        const res = copy_sketch_element_collection([this], target, position);
        return res.get_corresponding_sketch_element(this);
    }

    _rel_normalized_sample_points(rel_approx_sample_spacing: number | null = null) {
        return LineManipulation.rel_normalized_sample_points(this, rel_approx_sample_spacing);
    }

    _abs_normalized_sample_points(abs_approx_sample_spacing: number | null = null) {
        return LineManipulation.abs_normalized_sample_points(this, abs_approx_sample_spacing);
    }

    _remove_duplicate_points() {
        return LineManipulation.remove_duplicate_points(this);
    }

    renormalize(density: number | null = null) {
        return LineManipulation.renormalize(this, density)
    }

    smooth_out(ker_size: number = 0.1, ker_size_absolute: boolean = false) {
        return LineManipulation.smooth_out(this, ker_size, ker_size_absolute);
    }

    computer_center_point() {
        assert(!this._is_removed, "Line is removed");
        return this.to_absolute_position(LineManipulation.compute_center_point(this.sample_points));;
    }

    self_intersects(): boolean {
        return self_intersects(this);
    }

    static order_by_endpoints(...lines: Line[]): {
        lines: Line[],
        points: Point[],
        orientations: boolean[]
    } {
        if (Array.isArray(lines[0])) {
            lines = [...lines[0]];
        }
        if (lines.length == 0) {
            return {
                lines: [],
                points: [],
                orientations: []
            }
        }
        if (lines.length == 1) {
            return {
                lines: lines,
                points: lines[0].get_endpoints(),
                orientations: [true]
            }
        };
        if (lines.length == 2) return set_two_line_orientations({
            lines: lines
        });

        const res: {
            lines: Line[],
            points: Point[],
            orientations: boolean[]
        } = {
            lines: [], points: [], orientations: []
        };

        res.lines.push(lines.pop()!);
        res.orientations = [true];
        res.points = [res.lines[0]!.p1, res.lines[0]!.p2];

        let smth_found: boolean = false;
        while (lines.length > 0) {
            for (let i = lines.length - 1; i >= 0; i--) {
                if (res.lines[0].common_endpoint(lines[i])) {
                    // Prepend
                    smth_found = true;
                    res.lines.unshift(...lines.splice(i, 1));
                    if (res.lines.length == 2) {
                        set_two_line_orientations(res);
                    } else {
                        const next_orientation = res.orientations[0];
                        res.orientations.unshift(
                            res.lines[1][next_orientation ? "p1" : "p2"] == res.lines[0].p2
                        );
                        res.points.unshift(
                            res.lines[0].other_endpoint(res.points[0])
                        );
                    }
                } else if (res.lines[res.lines.length - 1].common_endpoint(lines[i])) {
                    // Append
                    smth_found = true;
                    res.lines.push(...lines.splice(i, 1));
                    if (res.lines.length == 2) {
                        set_two_line_orientations(res);
                    } else {
                        const prev_orientation =
                            res.orientations[res.orientations.length - 1];
                        res.orientations.push(
                            res.lines[res.lines.length - 2][
                            prev_orientation ? "p2" : "p1"
                            ] == res.lines[res.lines.length - 1].p1
                        );
                        res.points.push(
                            res.lines[res.lines.length - 1].other_endpoint(
                                res.points[res.points.length - 1]
                            )
                        );
                    }
                }
            }

            assert(smth_found, "Lines dotn form a connected segment");
        }

        function set_two_line_orientations(data: {
            lines: Line[],
            points?: Point[],
            orientations?: boolean[]
        }): {
            lines: Line[],
            points: Point[],
            orientations: boolean[]
        } {
            if (data.lines[1].has_endpoint(data.lines[0].p2)) {
                data.orientations = [true, data.lines[1].p1 == data.lines[0].p2];
                data.points = [
                    data.lines[0].p1,
                    data.lines[0].p2,
                    data.lines[1].other_endpoint(data.lines[0].p2),
                ];
            } else if (data.lines[1].has_endpoint(data.lines[0].p1)) {
                data.orientations = [false, data.lines[1].p1 == data.lines[0].p1];
                data.points = [
                    data.lines[0].p2,
                    data.lines[0].p1,
                    data.lines[1].other_endpoint(lines[0].p1),
                ];
            } else {
                assert(invalid_path("Lines dont form a connected segment"))
            }
            return data as any;
        }

        return res;
    }

    static oriented_circle(lines: Line[]): {
        lines: Line[], // Im Uhrzeigersinn
        points: Point[], // Im Uhrzeigersinn, startend mit dem Endpunkt der ersten Linie am weitersten vorne im Uhrzeigersinn
        orientations: boolean[] // Für jede Linie ob p1 -> p2 im Uhrzeigersinn verläuft
    } {
        const ordered_lines = Line.order_by_endpoints(...lines);
        assert(ordered_lines.points[0] == ordered_lines.points[ordered_lines.points.length - 1], "Lines dont form circle");

        // We assume no self-intersection
        const orientation = polygon_orientation(ordered_lines.points.slice(1));
        if (!orientation) {
            ordered_lines.lines.reverse();
            ordered_lines.points.reverse();
            ordered_lines.orientations.reverse();
            ordered_lines.orientations = ordered_lines.orientations.map(o => !o);
        }

        ordered_lines.points.shift();
        ordered_lines.orientations.shift();
        let orientations: boolean[];
        if (!ordered_lines.orientations[0]) {
            orientations = ordered_lines.orientations.map(o => !o);
        }

        return ordered_lines;
    }

    static straight(...endpoints: [Point, Point]) {
        return new Line(endpoints, [
            new Vector(0, 0),
            new Vector(1, 0),
        ]);
    }
}
