import { expect, invalid_path } from "../expect";
import {
    affine_transform_from_input_output,
    BoundingBox,
    closest_vec_on_line_segment,
    convex_hull,
    EPS,
    is_convex,
    orientation,
    PlainLine,
    polygon_orientation,
    Vector,
} from "../../geometrytry";
import { Cache } from "../utils/cache";
import { ConnectedComponent } from "./collection/connected_component";
import { copy_sketch_element_collection } from "./collection/copy";
import { Point } from "./point";
import { Sketch } from "./sketch";
import { SketchElement, StoffObjectData } from "./types";
import * as SketchElementCollectionMethods from "./collection/index";
// import { offset_polyline } from "../shapes/manipulations/offset_sample_points.tmp";
import {
    is_polygon,
    is_polyline,
    Polyline,
    Shape,
    to_shape,
} from "../../geometry_old/shapes/polylineine";

export class Line {
    public data: StoffObjectData = {};
    private cache: Cache = new Cache();

    // From p1 to p2 rightwards | if we merge lines with opposite orientations, we take the one of the first line
    public right_handed: boolean = true;
    private _is_removed = false;

    constructor(
        private endpoints: [Point, Point],
        private _shape: Shape,
    ) {
        /*
            Sample points is an array of absolute values [x, y] such that
            - the first point agrees with the first endpoint
            - the second point agrees with the second endpoint
            - if it is a polygon, the endpoints must agree
        */

        if (is_polyline(this.shape)) {
            expect(
                this.shape.first().distance_squared(this.p1) < EPS.COARSE &&
                    this.shape.last().distance_squared(this.p2) < EPS.COARSE,
                "Line sample points dont start and end at p1/p2",
            );
        } else {
            expect(
                this.shape.root().distance_squared(this.p1) < EPS.COARSE &&
                    this.shape.root().distance_squared(this.p1) < EPS.COARSE,
                "Polygon sample points dont start and end at p1/p2",
            );
        }

        this.endpoints[0].__register_line(this);
        this.endpoints[1].__register_line(this);
        this.get_sketch().__register_line(this);

        expect(
            this.endpoints[0].get_sketch() === this.endpoints[1].get_sketch(),
        );
        expect(
            this.endpoints[0].get_sketch() === this.endpoints[1].get_sketch(),
        );
    }

    get is_removed() {
        return this._is_removed;
    }

    get_sketch() {
        expect(!this._is_removed, "Line is removed");
        return this.p1.get_sketch();
    }

    get p1() {
        expect(!this._is_removed, "Line is removed");
        return this.endpoints[0];
    }
    set p1(p) {
        expect(!this._is_removed, "Line is removed");
        this.endpoints[0] = p;
        this.cache_update("endpoints");
    }
    get p2() {
        expect(!this._is_removed, "Line is removed");
        return this.endpoints[1];
    }
    set p2(p) {
        expect(!this._is_removed, "Line is removed");
        this.endpoints[1] = p;
        this.cache_update("endpoints");
    }
    get sample_points() {
        return this.shape.verticies;
    }
    set sample_points(points: Vector[]) {
        expect(!this._is_removed, "Line is removed");
        const shape = to_shape(points);
        if (is_polygon(shape)) {
            expect(is_polyline(this.shape), "Sample points don't form polygon");
            const offset = this.p1.subtract(shape.root());
            this._shape = shape.map((v) => v.add(offset));
            return;
        }

        const map_fun = affine_transform_from_input_output(
            [shape.first(), shape.last()],
            this.endpoints,
        );
        this._shape = shape.map(map_fun);
    }
    get shape() {
        return this._shape;
    }

    is_polygon(): boolean {
        return is_polygon(this.shape);
    }

    is_polyline(): boolean {
        return is_polyline(this.shape);
    }

    cache_update(...what: string[]) {
        expect(!this._is_removed, "Line is removed");
        this.cache.dependency_changed(...what);
    }

    offset_sample_points(_radius: number, _withHandedness: boolean = true) {
        expect(!this._is_removed, "Line is removed");
        throw new Error("Unimplemented");
        // return offset_polyline(
        //     this.get_absolute_sample_points(),
        //     radius,
        //     withHandedness ? this.right_handed : !this.right_handed,
        // );
    }

    set_endpoints(p1: Point, p2: Point) {
        expect(!this._is_removed, "Line is removed");
        this.p1.__unregister_line(this);
        this.p2.__unregister_line(this);

        this.p1 = p1;
        this.p2 = p2;

        p1.__register_line(this);
        p2.__register_line(this);

        return this;
    }

    remove() {
        expect(!this._is_removed, "Line is already removed");
        this.p1.__unregister_line(this);
        this.p2.__unregister_line(this);
        this.get_sketch().__unregister_line(this);
        this._is_removed = true;
    }

    other_endpoint(pt: SketchElement): Point {
        expect(this.is_adjacent(pt), "Line is not adjacent to thing");
        expect(!this._is_removed, "Line is removed");

        if (pt instanceof Line)
            return this.other_endpoint(this.common_endpoint(pt)!);
        return this.p1 == pt ? this.p2 : this.p1;
    }

    endpoint_from_orientation(bool: boolean = true) {
        expect(!this._is_removed, "Line is removed");
        return bool ? this.p1 : this.p2;
    }

    has_endpoint(pt: Point) {
        expect(!this._is_removed, "Line is removed");
        return this.p1 == pt || this.p2 == pt;
    }

    set_changed_endpoint(p1: Point, p2: Point) {
        expect(!this._is_removed, "Line is removed");
        if (this.p1 == p1) return this.set_endpoints(p1, p2);
        if (this.p2 == p1) return this.set_endpoints(p2, p1);
        if (this.p1 == p2) return this.set_endpoints(p2, p1);
        if (this.p2 == p2) return this.set_endpoints(p1, p2);
        expect(invalid_path());
    }

    replace_endpoint(old_pt: Point, new_pt: Point) {
        expect(!this._is_removed, "Line is removed");
        if (this.p1 == old_pt) return this.set_endpoints(new_pt, this.p2);
        if (this.p2 == old_pt) return this.set_endpoints(this.p1, new_pt);
        if (this.p1 == new_pt) return this.set_endpoints(old_pt, this.p2);
        if (this.p2 == new_pt) return this.set_endpoints(this.p1, old_pt);
        expect(invalid_path("Both endpoints dont belong to line"));
    }

    get_sample_points() {
        return this.sample_points;
    }

    is_straight() {
        expect(!this._is_removed, "Line is removed");
        return !this.sample_points.some((p) => p.y !== 0);
    }

    is_convex(allow_overflow: boolean = false) {
        expect(!this._is_removed, "Line is removed");
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
            sp[++first_non_zero_sp_index]!.distance(sp[0]!) < EPS.WEAK_EQUAL
        ) {}

        let last_non_one_sp_index = sp.length - 1;
        while (
            sp[--last_non_one_sp_index]!.distance(sp[sp.length - 1]!) <
            EPS.WEAK_EQUAL
        ) {}

        return (
            sp[first_non_zero_sp_index]!.x >= -EPS.MINY &&
            sp[last_non_one_sp_index]!.x <= 1 + EPS.MINY
        );
    }

    connected_component() {
        expect(!this._is_removed, "Line is removed");
        return new ConnectedComponent(this);
    }

    copy_sample_points() {
        return this.sample_points.map((v) => new Vector(v));
    }

    get_line_vector() {
        return this.p2.subtract(this.p1);
    }

    get_endpoints(): [Point, Point] {
        expect(!this._is_removed, "Line is removed");
        return [this.p1, this.p2];
    }

    get_adjacent_lines() {
        expect(!this._is_removed, "Line is removed");
        return SketchElementCollectionMethods.unique(
            this.p1.get_adjacent_lines().concat(this.p2.get_adjacent_lines()),
        ).filter((l: Line) => l !== this);
    }

    same_orientation(p1: Point, p2: Point): boolean;
    same_orientation(p: Point): boolean;
    same_orientation(l: Line): boolean;
    same_orientation(...args: any[]) {
        expect(!this._is_removed, "Line is removed");

        if (args[0] instanceof Line) {
            return (
                args[0].p2 == this.p1 ||
                args[0].p1 == this.p2 ||
                args[0] == this
            );
        }

        expect(this.has_endpoint(args[0]));
        expect(!args[1] || this.has_endpoint(args[1]));
        return this.p1 == args[0];
    }

    same_handedness(line: Line) {
        expect(!this._is_removed, "Line is removed");
        if (this.same_orientation(line)) {
            return this.right_handed == line.right_handed;
        }

        expect(!!this.common_endpoint(line), "Lines dont have common endpoint");
        return this.right_handed != line.right_handed;
    }

    get_tangent_line(pt: Vector | Point) {
        expect(!this._is_removed, "Line is removed");
        return PlainLine.from_direction(pt, this.get_tangent_vector(pt));
    }

    get_tangent_vector(pt: Vector | Point) {
        expect(!this._is_removed, "Line is removed");
        // Points along the line in the direction this.p1 -> this.p2, unless we put in this.p1;

        if (this.p1.equals(pt)) {
            let i = 1;
            while (
                this.sample_points[i]!.distance(this.sample_points[0]!) <
                EPS.MEDIUM
            ) {
                i++;
            }
            const tangent_inwards = this.p1
                .subtract(this.sample_points[i]!)
                .normalize();
            return this.p1 == pt ? tangent_inwards : tangent_inwards.invert();
        }

        if (this.p2.equals(pt)) {
            let i = this.sample_points.length - 1;
            while (
                this.sample_points[i]!.distance(
                    this.sample_points[this.sample_points.length - 1]!,
                ) < EPS.MEDIUM
            ) {
                i--;
            }
            return this.p2.subtract(this.sample_points[i]!).normalize();
        }

        let min = Infinity;
        let best_index: number = 0;

        for (let i = 0; i < this.sample_points.length - 1; i++) {
            const closest_on_line = closest_vec_on_line_segment(
                [this.sample_points[i]!, this.sample_points[i + 1]!],
                pt,
            );
            const dist = closest_on_line.distance(pt);

            if (dist < min) {
                min = dist;
                best_index = i;
            }
        }

        expect(min < EPS.MODERATE, "Vector/Point is not on line.");

        let left = best_index;
        let right = best_index + 1;
        while (
            this.sample_points[left]!.distance_squared(
                this.sample_points[right]!,
            ) < EPS.FINE_SQUARED
        ) {
            if (left > 0) left--;
            if (right < this.sample_points.length - 1) right++;
        }

        return this.sample_points[right]!.subtract(this.sample_points[left]!);
    }

    mirror(direction: boolean = false) {
        expect(!this._is_removed, "Line is removed");
        if (direction) {
            const t = this.p1;
            this.p1 = this.p2;
            this.p2 = t;
            this.swap_orientation();
            // This performs double mirror
        }
        this.right_handed = !this.right_handed;
        for (let i = 0; i < this.sample_points.length; i++) {
            const p = this.sample_points[i]!;
            this.sample_points[i] = new Vector(p.x, -p.y);
        }
        this.cache_update("sample_points");
        return this;
    }

    set_orientation(p1: Point, p2?: Point) {
        expect(!this._is_removed, "Line is removed");
        expect(this.endpoints.includes(p1), "Point isnt endpoint of line.");
        expect(
            !p2 || this.endpoints.includes(p2),
            "Point isnt endpoint of line.",
        );

        if (p1 == this.p2) {
            this.swap_orientation();
        }

        return this;
    }

    swap_orientation() {
        expect(!this._is_removed, "Line is removed");
        const t = this.p1;
        this.p1 = this.p2;
        this.p2 = t;
        this.sample_points.reverse();
        for (let i = 0; i < this.sample_points.length; i++) {
            const p = this.sample_points[i]!;
            this.sample_points[i] = new Vector(1 - p.x, -p.y);
        }
        this.cache_update("sample_points");
        this.right_handed = !this.right_handed;

        return this;
    }

    swap_handedness() {
        expect(!this._is_removed, "Line is removed");
        this.right_handed = !this.right_handed;
        return this;
    }

    set_handedness(cmpr: boolean | Line | Vector): boolean {
        expect(!this._is_removed, "Line is removed");
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
            return (this.right_handed = !orientation(this.p1, this.p2, cmpr));
        }

        return expect(invalid_path());
    }

    stretch(factor = 1) {
        expect(!this._is_removed, "Line is removed");

        for (let i = 0; i < this.sample_points.length; i++) {
            const p = this.sample_points[i]!;
            this.sample_points[i] = new Vector(p.x, factor * p.y);
        }

        this.cache_update("sample_points");
        return this;
    }

    endpoint_distance() {
        expect(!this._is_removed, "Line is removed");
        return this.p1.distance(this.p2);
    }

    get_length() {
        expect(!this._is_removed, "Line is removed");
        return this.cache.compute_dependent(
            "get_length",
            ["endpoints", "sample_points"],
            () => {
                const endpoint_distance = this.endpoint_distance();
                let sum = 0;

                for (let i = 0; i < this.sample_points.length - 1; i++) {
                    sum += this.sample_points[i]!.distance(
                        this.sample_points[i + 1]!,
                    );
                }

                return sum * endpoint_distance;
            },
        );
    }

    get_bounding_box() {
        expect(!this._is_removed, "Line is removed");
        return this.cache.compute_dependent(
            "bounding_box",
            ["absolute_sample_points"],
            () => {
                return BoundingBox.from_points(this.sample_points);
            },
        );
    }

    convex_hull() {
        expect(!this._is_removed, "Line is removed");
        return this.cache.compute_dependent(
            "convex_hull",
            ["absolute_sample_points"],
            () => {
                return convex_hull(this.sample_points);
            },
        );
    }

    is_adjacent(thing: SketchElement) {
        expect(!this._is_removed, "Line is removed");

        if (thing instanceof Point) {
            return thing == this.p1 || thing == this.p2;
        }

        return this.has_endpoint(thing.p1) || this.has_endpoint(thing.p2);
    }

    common_endpoint(line: Line) {
        expect(!this._is_removed, "Line is removed");
        if (this.p1 == line.p1 || this.p1 == line.p2) {
            return this.p1;
        }
        if (this.p2 == line.p1 || this.p2 == line.p2) {
            return this.p2;
        }

        throw new Error("Lines don't have common endpoint!");
    }

    position_at_length(length: number, reversed = false): Vector {
        expect(!this._is_removed, "Line is removed");
        const l = this.get_length();
        length = length >= 0 ? length : l - length;
        expect(length <= l, "Specified length longer than line.");

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
                next_length = this.sample_points[i + 1]!.distance(
                    this.sample_points[START_I]!,
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

                return Vector.lerp(
                    this.sample_points[i]!,
                    this.sample_points[i + 1]!,
                    fraction_left,
                );
            }

            sum += next_length;
        }

        throw expect(invalid_path());
    }

    position_at_fraction(f: number, reversed = false) {
        expect(!this._is_removed, "Line is removed");
        expect(Math.abs(f) <= 1, "Fraction is not in range [-1,1]");

        f = f >= 0 ? f : 1 - f;
        return this.position_at_length(f * this.get_length(), reversed);
    }

    closest_position(vec: Vector) {
        expect(!this._is_removed, "Line is removed");

        let min: number = Infinity;
        let best: Vector = new Vector(0, 0);

        for (let i = 0; i < this.sample_points.length - 1; i++) {
            const closest_on_line = closest_vec_on_line_segment(
                [this.sample_points[i]!, this.sample_points[i + 1]!],
                vec,
            );
            const dist = closest_on_line.distance(vec);

            if (dist < min) {
                min = dist;
                best = closest_on_line;
            }
        }

        return best;
    }

    minimal_distance(vec: Vector) {
        expect(!this._is_removed, "Line is removed");
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
        expect(!this._is_removed, "Line is removed");
        const res = copy_sketch_element_collection([this], target, position);
        return res.corresponding_sketch_element(this);
    }

    resample(
        sample_spacing: number | null = null,
        smoothness_angle: number = Math.PI * 1.2, // Low angle leads to smoothing even around sharper corners
    ) {
        this._shape = this.shape.resample(sample_spacing, smoothness_angle);
    }

    smooth_out(ker_size: number = 0.1, sample_spacing: number | null = null) {
        return this.shape.smooth_out(ker_size, sample_spacing);
    }

    static order_by_endpoints(...lines: Line[]): {
        lines: Line[];
        points: Point[];
        orientations: boolean[];
    } {
        if (Array.isArray(lines[0])) {
            lines = [...lines[0]];
        }
        if (lines.length == 0) {
            return {
                lines: [],
                points: [],
                orientations: [],
            };
        }
        if (lines.length == 1) {
            return {
                lines: lines,
                points: lines[0]!.get_endpoints(),
                orientations: [true],
            };
        }
        if (lines.length == 2)
            return set_two_line_orientations({
                lines: lines,
            });

        const res: {
            lines: Line[];
            points: Point[];
            orientations: boolean[];
        } = {
            lines: [],
            points: [],
            orientations: [],
        };

        res.lines.push(lines.pop()!);
        res.orientations = [true];
        res.points = [res.lines[0]!.p1, res.lines[0]!.p2];

        let smth_found: boolean = false;
        while (lines.length > 0) {
            for (let i = lines.length - 1; i >= 0; i--) {
                if (res.lines[0]!.common_endpoint(lines[i]!)) {
                    // Prepend
                    smth_found = true;
                    res.lines.unshift(...lines.splice(i, 1));
                    if (res.lines.length == 2) {
                        set_two_line_orientations(res);
                    } else {
                        const next_orientation = res.orientations[0];
                        res.orientations.unshift(
                            res.lines[1]![next_orientation ? "p1" : "p2"] ==
                                res.lines[0]!.p2,
                        );
                        res.points.unshift(
                            res.lines[0]!.other_endpoint(res.points[0]!),
                        );
                    }
                } else if (
                    res.lines[res.lines.length - 1]!.common_endpoint(lines[i]!)
                ) {
                    // Append
                    smth_found = true;
                    res.lines.push(...lines.splice(i, 1));
                    if (res.lines.length == 2) {
                        set_two_line_orientations(res);
                    } else {
                        const prev_orientation =
                            res.orientations[res.orientations.length - 1];
                        res.orientations.push(
                            res.lines[res.lines.length - 2]![
                                prev_orientation ? "p2" : "p1"
                            ] == res.lines[res.lines.length - 1]!.p1,
                        );
                        res.points.push(
                            res.lines[res.lines.length - 1]!.other_endpoint(
                                res.points[res.points.length - 1]!,
                            ),
                        );
                    }
                }
            }

            expect(smth_found, "Lines dotn form a connected segment");
        }

        function set_two_line_orientations(data: {
            lines: Line[];
            points?: Point[];
            orientations?: boolean[];
        }): {
            lines: Line[];
            points: Point[];
            orientations: boolean[];
        } {
            const l0 = data.lines[0]!;
            const l1 = data.lines[1]!;

            if (l1.has_endpoint(l0.p2)) {
                data.orientations = [true, l1.p1 == l0.p2];
                data.points = [l0.p1, l0.p2, l1.other_endpoint(l0.p2)];
            } else if (l1.has_endpoint(l0.p1)) {
                data.orientations = [false, l1.p1 == l0.p1];
                data.points = [l0.p2, l0.p1, l1.other_endpoint(l0.p1)];
            } else {
                expect(invalid_path("Lines dont form a connected segment"));
            }

            return data as any;
        }

        return res;
    }

    static oriented_circle(lines: Line[]): {
        lines: Line[]; // Im Uhrzeigersinn
        points: Point[]; // Im Uhrzeigersinn, startend mit dem Endpunkt der ersten Linie am weitersten vorne im Uhrzeigersinn
        orientations: boolean[]; // Für jede Linie ob p1 -> p2 im Uhrzeigersinn verläuft
    } {
        const ordered_lines = Line.order_by_endpoints(...lines);
        expect(
            ordered_lines.points[0] ==
                ordered_lines.points[ordered_lines.points.length - 1],
            "Lines dont form circle",
        );

        // We assume no self-intersection
        const orientation = polygon_orientation(ordered_lines.points.slice(1));
        if (!orientation) {
            ordered_lines.lines.reverse();
            ordered_lines.points.reverse();
            ordered_lines.orientations.reverse();
            ordered_lines.orientations = ordered_lines.orientations.map(
                (o) => !o,
            );
        }

        ordered_lines.points.shift();
        ordered_lines.orientations.shift();

        return ordered_lines;
    }

    static straight(...endpoints: [Point, Point]) {
        return new Line(
            endpoints,
            new Polyline(endpoints.map((p) => p.vector())),
        );
    }
}
