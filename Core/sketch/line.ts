import { expect, invalid_path } from "../expect";
import { Point } from "./point";
import { SketchElement, StoffObjectData } from "./types";
import * as SketchElementCollectionMethods from "./collection/index";
import { LinearTransform, Polygon, Polyline, Shape, Vector } from "../geometry";
import { EPS } from "../numerics";
import { same_sketch } from "@/todo/expect_methods/exports";
import { CollectionMethods } from ".";

export class Line {
    public data: StoffObjectData = {};

    // From p1 to p2 rightwards | if we merge lines with opposite orientations, we take the one of the first line
    // Makes sense (consistent locally) also for polygons
    public right_handed: boolean = true;
    private _is_removed = false;

    constructor(
        private _endpoints: [Point, Point],
        private _shape: Shape.Shape,
    ) {
        /*
            Sample points is an array of absolute values [x, y] such that
            - the first point agrees with the first endpoint
            - the second point agrees with the second endpoint
            - if it is a polygon, the endpoints must agree
        */

        this._endpoints[0].__register_line(this);
        if (this._endpoints[0] !== this._endpoints[1]) {
            this._endpoints[1].__register_line(this);
        }
        this.sketch.__register_line(this);

        // For sizing it correctly
        this.update_shape(this._shape);

        this.validate_self();
    }

    get is_removed() {
        return this._is_removed;
    }

    get sketch() {
        expect(!this._is_removed, "Line is removed");
        return this.p1.sketch;
    }

    get p1() {
        expect(!this._is_removed, "Line is removed");
        return this._endpoints[0];
    }
    get p2() {
        expect(!this._is_removed, "Line is removed");
        return this._endpoints[1];
    }

    endpoints(): [Point, Point] {
        return [...this._endpoints];
    }

    get shape() {
        return this._shape;
    }

    update_shape(shape: Shape.Shape) {
        expect(!shape.is_empty());
        if (shape instanceof Polygon || shape.first()!.equals(shape.last()!)) {
            expect(this.p1.equals(this.p2));
            const diff = Vector.subtract(this.p1, shape.verticies[0]!);
            if (diff.length() < EPS.tiny) return;
            this._shape = shape.map((v) => v.add(diff));
            return;
        }

        if (
            shape.first()!.distance(this.p1) < EPS.tiny &&
            shape.last()!.distance(this.p2) < EPS.tiny
        ) {
            this._shape = shape;
            return;
        }
        const trafo = LinearTransform.affine_orthogonal(
            [shape.first()!, shape.last()!],
            [this.p1, this.p2],
        );
        this._shape = shape.map(trafo);
    }

    set_endpoints(p1: Point, p2: Point) {
        expect(!this._is_removed, "Line is removed");
        this.p1.__unregister_line(this);

        if (this.p1 !== this.p2) {
            this.p2.__unregister_line(this);
        }

        this._endpoints = [p1, p2];

        p1.__register_line(this);
        if (p1 !== p2) {
            p2.__register_line(this);
        }

        return this;
    }

    mirror() {
        if (this.shape.is_polygon()) {
            const transform = LinearTransform.mirror(this.shape.verticies[0]!);
            this.update_shape(this.shape.map(transform));
        } else {
            const transform = LinearTransform.mirror([this.p1, this.p2]);
            this.update_shape(this.shape.map(transform));
        }

        this.right_handed = !this.right_handed;
    }

    flip() {
        let trafo: LinearTransform.LinearTransformation;
        if (!this.is_closed()) {
            trafo = LinearTransform.affine_orthogonal(this._endpoints, [
                this.p2,
                this.p1,
            ]);
            this._shape = this._shape.map(trafo);
        } else {
            this._shape = this._shape.reverse();
        }

        this._endpoints = [this._endpoints[1], this._endpoints[0]];
        this.right_handed = !this.right_handed;
        return this;
    }

    remove() {
        expect(!this._is_removed, "Line is already removed");
        this.p1.__unregister_line(this);
        this.p2.__unregister_line(this);
        this.sketch.__unregister_line(this);
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
        expect(invalid_path("No endpoint belonged to line"));
    }

    closest_position(to: Vector): Vector {
        return this.shape.closest_shape_position(to)!.vec;
    }

    position_at_length(
        at:
            | number
            | {
                  at: number;
                  relative: boolean;
              },
    ): Vector {
        return this.shape.shape_point_descriptor_to_shape_position(at)!.vec;
    }

    split_at(
        at:
            | Point
            | Vector
            | number
            | {
                  at: number;
                  relative: boolean;
              }
            | Shape.ShapePosition,
    ): {
        line_segments: [Line, Line];
        point: Point;
    } {
        const descriptor =
            this.shape.shape_point_descriptor_to_shape_position(at)!;
        const pt =
            at instanceof Point ? at : this.sketch.add_point(descriptor.vec);

        const shape1 = this.shape.typesafe().slice("start", descriptor);
        const shape2 = this.shape.typesafe().slice(descriptor, "end");

        const l1 = new Line([this.p1, pt], shape1);
        const l2 = new Line([pt, this.p2], shape2);

        this.remove();
        return {
            line_segments: [l1, l2],
            point: pt,
        };
    }

    replace_endpoint(old_pt: Point, new_pt: Point) {
        expect(!this._is_removed, "Line is removed");
        if (this.p1 == old_pt) return this.set_endpoints(new_pt, this.p2);
        if (this.p2 == old_pt) return this.set_endpoints(this.p1, new_pt);
        if (this.p1 == new_pt) return this.set_endpoints(old_pt, this.p2);
        if (this.p2 == new_pt) return this.set_endpoints(this.p1, old_pt);
        expect(invalid_path("Both endpoints dont belong to line"));
    }

    adjacent_lines() {
        expect(!this._is_removed, "Line is removed");
        return SketchElementCollectionMethods.unique(
            this.p1.adjacent_lines().concat(this.p2.adjacent_lines()),
        ).filter((l: Line) => l !== this);
    }

    same_orientation(p1: Point, p2: Point): boolean;
    same_orientation(p: Point): boolean;
    same_orientation(l: Line): boolean;
    same_orientation(...args: any[]) {
        // shape x shape with not all points equal: test if somehow its A.p1 -> B.p2
        // shape x shape with all points in common: test if cw / ccw is the same
        // point, (point | undefined): test if first point is p1
        // UB if not touching

        expect(!this._is_removed, "Line is removed");

        if (args[0] instanceof Point) {
            return this.p1 == args[0];
        }

        const l: Line = args[0];

        if (l.p1 == l.p2 && l.p1 == this.p1 && l.p1 == this.p2) {
            return (
                this.shape.as_polygon().orientation() ==
                l.shape.as_polygon().orientation()
            );
        }

        return l.p1 == this.p2 || this.p1 == l.p2;
    }

    same_handedness(line: Line) {
        // shape x shape with all points in common: objective handedness
        // line x line with one/two point in common: objective handedness
        // shape x shape with three points in common: true
        // UB else

        expect(!this._is_removed, "Line is removed");

        if (line.p1 == line.p2 && line.p1 == this.p1 && line.p1 == this.p2) {
            let same_orientation =
                this.shape.as_polygon().orientation() ==
                line.shape.as_polygon().orientation();
            let same_handedness = this.right_handed == line.right_handed;

            return same_orientation == same_handedness;
        }

        if (this.p2 == line.p1) {
            if (this.p1 == this.p2 || line.p2 == this.p2) return true;
            return this.right_handed == line.right_handed;
        }

        if (this.p2 == line.p2) {
            if (this.p1 == this.p2 || line.p1 == this.p2) return true;
            return this.right_handed != line.right_handed;
        }

        if (this.p1 == line.p1) {
            if (this.p2 == this.p1 || line.p2 == this.p1) return true;
            return this.right_handed != line.right_handed;
        }

        if (this.p1 == line.p2) {
            if (this.p2 == this.p1 || line.p1 == this.p1) return true;
            return this.right_handed != line.right_handed;
        }

        return false;
    }

    set_orientation(p1: Point, p2: Point): this;
    set_orientation(p: Point): this;
    set_orientation(l: Line): this;
    set_orientation(...args: any[]): this {
        if (!(this.same_orientation as any)(...args)) {
            return this.swap_orientation();
        }

        return this;
    }

    swap_orientation() {
        expect(!this._is_removed, "Line is removed");

        this._endpoints = [this._endpoints[1], this._endpoints[0]];
        this._shape = this._shape.reverse();

        this.right_handed = !this.right_handed;
        return this;
    }

    swap_handedness() {
        expect(!this._is_removed, "Line is removed");
        this.right_handed = !this.right_handed;
        return this;
    }

    set_handedness(cmpr: boolean | Line): boolean {
        expect(!this._is_removed, "Line is removed");
        if (typeof cmpr == "boolean") {
            return (this.right_handed = cmpr);
        }

        if (this.same_handedness(cmpr)) {
            return this.right_handed;
        }

        return (this.right_handed = !this.right_handed);
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

    validate_self() {
        expect(!this.shape.is_empty());
        if (this.shape instanceof Polygon) {
            expect(
                this.shape.root()!.distance_squared(this.p1) < EPS.tiny &&
                    this.shape.root()!.distance_squared(this.p2) < EPS.tiny,
                "Polygon sample points dont start and end at p1/p2",
            );
        } else {
            expect(
                this.shape.first()!.distance_squared(this.p1) < EPS.tiny &&
                    this.shape.last()!.distance_squared(this.p2) < EPS.tiny,
                "Line sample points dont start and end at p1/p2",
            );
        }

        expect(same_sketch(...this._endpoints));
    }

    length() {
        return this.shape.length();
    }

    is_closed() {
        return this.shape.is_polygon();
    }

    toString() {
        return "[Line]" as const;
    }

    bounding_box() {
        return this.shape.bounding_box();
    }

    connected_component() {
        expect(!this._is_removed, "Point is removed");
        return CollectionMethods.connected_component(this.sketch, this);
    }

    toJSON() {
        return {
            p1: this.p1.toJSON(),
            p2: this.p2.toJSON(),
            sample_points: this.shape.verticies,
        };
    }

    static straight(...endpoints: [Point, Point]) {
        return new Line(
            endpoints,
            new Polyline(endpoints.map((p) => p.vector())),
        );
    }
}
