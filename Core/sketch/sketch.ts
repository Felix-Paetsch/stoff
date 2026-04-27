import { Expect } from "@/Core";
import { CollectionMethods, Copy } from ".";
import { Validate } from "../../Dev/lib";
import { LinearTransform, Polygon, Shape, Vector } from "../geometry";
import { default_data_callback } from "./copy";
import { Line } from "./line";
import { Point } from "./point";
import {
    SketchElement,
    SketchElementCollection,
    StoffObjectData,
} from "./types";

export class Sketch {
    private _points: Point[] = [];
    private _lines: Line[] = [];

    public data: StoffObjectData = {};

    constructor() {}

    __register_point(pt: Point) {
        this._points.push(pt);
    }

    __register_line(ln: Line) {
        this._lines.push(ln);
    }

    __unregister_point(pt: Point) {
        this._points = this._points.filter((p) => p != pt);
    }

    __unregister_line(ln: Line) {
        this._lines = this._lines.filter((l) => l != ln);
    }

    bounding_box() {
        return CollectionMethods.get_bounding_box(this);
    }

    points() {
        return [...this._points];
    }

    lines() {
        return [...this._lines];
    }

    add_point(pt: Vector): Point;
    add_point(x: number, y: number): Point;
    add_point(a: any, b?: any): Point {
        if (a instanceof Vector) {
            return new Point(this, a.x, a.y);
        }

        return new Point(this, a, b);
    }

    get_sketch_elements() {
        return [...this._lines, ...this._points];
    }

    get sketch() {
        return this;
    }

    remove(...els: (SketchElement | SketchElementCollection)[]) {
        const points_to_remove: Point[] = [];
        const lines_to_remove: Line[] = [];

        for (let i = 0; i < els.length; i++) {
            const el = els[i]!;
            if (el instanceof Point) {
                points_to_remove.push(el);
            } else if (el instanceof Line) {
                lines_to_remove.push(el);
            } else {
                const points = CollectionMethods.get_points(el);
                const lines = CollectionMethods.get_lines(el);
                lines_to_remove.push(...lines);
                points_to_remove.push(...points);
            }
        }

        lines_to_remove.forEach((l) => l.remove());
        points_to_remove.forEach((p) => p.remove());
    }

    clear() {
        this.remove(...this._points);
    }

    add_line(
        shape: Shape,
        from?: Point | Vector | null,
        to?: Point | Vector | null,
    ): Line {
        Expect.that(!shape.is_empty());

        if (!from) {
            if (to instanceof Vector) {
                const offset = Vector.subtract(to, shape.as_polyline().last()!);
                shape = shape.typesafe().map((v) => v.add(offset));
                from = shape.vertices[0]!;
            } else {
                from = shape.vertices[0]!;
                to = shape.as_polyline().last()!;
            }
        } else {
            if (to instanceof Vector) {
                const trafo = LinearTransform.affine_orthogonal(
                    [from instanceof Vector ? from : from.vec, shape.vertices[0]!],
                    [to, shape.as_polyline().last()!],
                );

                shape = shape.typesafe().map(trafo);
            } else {
                const offset = Vector.subtract(
                    from instanceof Vector ? from : from.vec,
                    shape.as_polyline().first()!,
                );
                shape = shape.typesafe().map((v) => v.add(offset));
                to = shape.as_polyline().last()!;
            }
        }

        if (!(to instanceof Point)) {
            to = this.add_point(to);
        }

        if (!(from instanceof Point)) {
            from = this.add_point(from);
        }

        if (!to) {
            if (shape instanceof Polygon) {
                to = from;
            } else {
                to = this.add_point(shape.as_polyline().last()!);
            }
        } else if (!(to instanceof Point)) {
            to = this.add_point(to);
        }

        return new Line([from as Point, to as Point], shape.typesafe());
    }

    line_between_points(p1: Point, p2: Point, shape?: Shape) {
        if (!shape) {
            return Line.straight(p1, p2);
        }

        return new Line([p1, p2], shape.typesafe());
    }

    transform(fn: (v: Vector) => Vector) {
        this._points.forEach((p) => p._unsafe_move_to(fn(p.vec)));
        this._lines.forEach((l) => l.update_shape(l.shape.map(fn)));
        return this;
    }

    // ===============

    merge_points(
        pt1: Point,
        pt2: Point,
        data_callback = default_data_callback,
    ) {
        if (pt1 == pt2) return pt1;
        Expect.that(pt1.vec.equals(pt2.vec));

        pt2.data = data_callback(pt2.data, pt1.data, pt2, pt1);

        pt2.adjacent_lines().forEach((line) => {
            if (line.p1 !== pt2) {
                line.set_endpoints(line.p1, pt1);
            } else {
                line.set_endpoints(pt1, line.p2);
            }
        });

        this.remove(pt2);
        return pt1;
    }

    merge_lines(
        line1: Line,
        line2: Line,
        delete_join: boolean = false,
        data_callback: Copy.CopySketchObjectDataCallback = Copy.default_data_callback,
    ) {
        Expect.that(Validate.same_sketch(line1, line2, this));

        let new_endpoints: [Point, Point];
        let handedness = line1.right_handed;
        let shape: Shape;

        if (line1.p2 == line2.p1) {
            new_endpoints = [line1.p1, line2.p2];
            shape = Shape.merge(line1.shape, line2.shape);
        } else if (line1.p1 == line2.p2) {
            new_endpoints = [line2.p1, line1.p2];
            shape = Shape.merge(line2.shape, line1.shape);
        } else if (line1.p1 == line2.p1) {
            handedness = !handedness;
            new_endpoints = [line1.p2, line2.p2];
            shape = Shape.merge(line1.shape.reverse(), line2.shape);
        } else if (line1.p2 == line2.p2) {
            new_endpoints = [line1.p1, line2.p1];
            shape = Shape.merge(line1.shape, line2.shape.reverse());
        } else {
            throw new Error("Lines have no endpoint in common");
        }

        const new_line = new Line(new_endpoints, shape.typesafe());

        new_line.set_handedness(handedness);
        new_line.data = data_callback(line1.data, line2.data, line1, line2);

        if (delete_join) {
            line1
                .endpoints()
                .filter((p) => !new_endpoints.includes(p))
                .map((p) => p.remove());
        } else {
            line1.remove();
            line2.remove();
        }

        return new_line;
    }

    intersect_lines(
        line1: Line,
        line2: Line,
    ): {
        intersection_points: Point[];
        l1_segments: Line[];
        l2_segments: Line[];
    } {
        const ip = Shape.intersection_positions(line1.shape, line2.shape);
        ip.sort(([_, a], [__, b]) => b.index + b.frac - a.index - a.frac);

        let last_point: Point = line2.p1;
        const l2_segments: Line[] = [];
        const points: [Point, Shape.ShapePosition][] = [];

        ip.unshift([
            null as any,
            line2.shape.shape_point_descriptor_to_shape_position("start")!,
        ]);
        for (let i = 1; i < ip.length; i++) {
            const pt = this.add_point(ip[i]![0].vec);
            points.push([pt, ip[i]![0]]);
            l2_segments.push(
                new Line(
                    [last_point, pt],
                    line2.shape.slice(ip[i - 1]![1], ip[i]![0]),
                ),
            );
            last_point = pt;
        }
        l2_segments.push(
            new Line(
                [last_point, line2.p2],
                line2.shape.slice(ip[ip.length - 1]![1], "end"),
            ),
        );
        ip.shift();

        const l1_segments: Line[] = [];
        points.sort(([_, a], [__, b]) => b.index + b.frac - a.index - a.frac);
        points.unshift([
            line1.p1,
            line1.shape.shape_point_descriptor_to_shape_position("start")!,
        ]);
        for (let i = 1; i < points.length; i++) {
            l1_segments.push(
                new Line(
                    [points[i - 1]![0], points[i]![0]],
                    line2.shape.slice(points[i - 1]![1], points[i]![1]),
                ),
            );
        }
        l1_segments.push(
            new Line(
                [points[points.length - 1]![0], line1.p2],
                line2.shape.slice(points[points.length - 1]![1], "end"),
            ),
        );
        points.shift();

        return {
            intersection_points: points.map((p) => p[0]),
            l1_segments,
            l2_segments,
        };
    }

    has(...els: SketchElement[]) {
        for (const el of els) {
            if (el instanceof Point && !this._points.includes(el)) {
                return false;
            } else if (el instanceof Line && !this._lines.includes(el)) {
                return false;
            }
        }

        return true;
    }

    copy(data_callback = Copy.default_data_callback): {
        sketch: Sketch;
    } & Copy.CopyResult {
        const t = new Sketch();
        const res = Copy.sketch(this, t, data_callback);
        return {
            ...res,
            sketch: t,
        };
    }

    toString() {
        return "[Sketch]" as const;
    }
}
