import {
    copy_sketch,
    copy_sketch_element_collection,
    CopyResult,
    CopySketchObjectDataCallback,
    default_data_callback,
} from "../collection/copy";
import { UP, Vector, Length, Radians } from "../../geometry";
import { Line } from "../line";
import { Point } from "../point";

import { auto_validate } from "./auto_validate";
import {
    DropFirst,
    SketchElement,
    SketchElementCollection,
    StoffObjectData,
} from "../types";

import * as CollectionMethods from "../collection";
import * as LineMethods from "./line_methods";
import * as SewingMethods from "./advanced_methods/exports";

import {
    AvoidantConnectedComponent,
    ConnectedComponent,
} from "../collection/connected_component";
import { expect } from "../../expect";
import { Shape } from "../../geometry/shapes";
import { Polyline } from "../../geometry/shapes/polyline";

export class Sketch {
    private points: Point[] = [];
    private lines: Line[] = [];

    public data: StoffObjectData = {};

    constructor() {}

    __register_point(pt: Point) {
        this.points.push(pt);
    }

    __register_line(ln: Line) {
        this.lines.push(ln);
    }

    __unregister_point(pt: Point) {
        this.points = this.points.filter((p) => p != pt);
    }

    __unregister_line(ln: Line) {
        this.lines = this.lines.filter((l) => l != ln);
    }

    get_bounding_box() {
        return CollectionMethods.get_bounding_box(this);
    }

    point(x: number, y: number) {
        return this.add_point(new Vector(x, y));
    }

    add_point(pt: Vector): Point {
        return new Point(this, pt);
    }

    // point(pt: Vector): Point;
    // point(x: number, y: number): Point;
    // point(a: any, b?: any): Point {
    //     if (a instanceof Vector) {
    //         return new Point(this, a.x, a.y);
    //     }
    //
    //     return new Point(this, a, a);
    // }

    get_points() {
        return this.points;
    }

    get_lines() {
        return this.lines;
    }

    get_sketch_elements() {
        return [...this.lines, ...this.points];
    }

    get_sketch() {
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
        this.remove(...this.points);
    }

    // ===============

    merge_points(
        pt1: Point,
        pt2: Point,
        data_callback = default_data_callback,
    ) {
        if (pt1 == pt2) return pt1;
        expect(pt1.equals(pt2));

        pt2.data = data_callback(pt2.data, pt1.data, pt2, pt1);

        pt2.get_adjacent_lines().forEach((line) => {
            if (line.p1 !== pt2) {
                line.set_endpoints(line.p1, pt1);
            } else {
                line.set_endpoints(pt1, line.p2);
            }
        });

        this.remove(pt2);
        return pt1;
    }

    copy() {
        const new_s = new Sketch();
        return {
            ...new_s.paste_sketch(this),
            sketch: new_s,
        };
    }

    paste_sketch(sketch: Sketch): CopyResult;
    paste_sketch(sketch: Sketch, position: Vector): CopyResult;
    paste_sketch(
        sketch: Sketch,
        data_callback: CopySketchObjectDataCallback,
    ): CopyResult;
    paste_sketch(
        sketch: Sketch,
        data_callback: CopySketchObjectDataCallback,
        position: Vector,
    ): CopyResult;
    paste_sketch(
        sketch: Sketch,
        data_callback: Vector | CopySketchObjectDataCallback | null = null,
        position: Vector | null = null,
    ): CopyResult {
        if (data_callback instanceof Vector) {
            position = data_callback;
            data_callback = null;
        }
        if (data_callback == null) {
            data_callback = default_data_callback;
        }
        return copy_sketch(sketch, this, data_callback, position);
    }

    paste_sketch_element_collection(
        sec: SketchElementCollection,
        position?: Vector,
    ): CopyResult;
    paste_sketch_element_collection(
        sec: SketchElementCollection,
        position: Vector | null = null,
    ): CopyResult {
        return copy_sketch_element_collection(sec, this, position);
    }

    has(...els: (Point | Line | ConnectedComponent)[]) {
        for (const el of els) {
            if (el instanceof Point && !this.points.includes(el)) {
                return false;
            } else if (el instanceof Line && !this.lines.includes(el)) {
                return false;
            } else if (
                el instanceof ConnectedComponent &&
                !this.has(el.root())
            ) {
                return false;
            }
        }

        return true;
    }

    toString() {
        return "[Sketch]" as const;
    }

    // =========== LINE METHODS ==========

    line_between_points(pt1: Point, pt2: Point) {
        return LineMethods.line_between_points(pt1, pt2);
    }

    line_at_angle(
        point: Point,
        angle: Radians,
        length: Length,
        reference_direction: Vector = UP,
        absolute: boolean = false, // Whether the direction is pointed from 0 or towards this point
    ) {
        return LineMethods.line_at_angle(
            point,
            angle,
            length,
            reference_direction,
            absolute,
        );
    }

    line_from_function_graph(
        pt1: Point,
        pt2: Point,
        f_1: (x: number) => number,
    ) {
        return LineMethods.line_between_points_from_shape(
            pt1,
            pt2,
            Polyline.from_function_graph(f_1),
        );
    }

    line_between_points_from_shape(pt1: Point, pt2: Point, shape: Shape) {
        return LineMethods.line_between_points_from_shape(pt1, pt2, shape);
    }

    interpolate_lines(
        line1: Line,
        line2: Line,
        f: LineMethods.NumberFunction = (x) => x,
        p1: LineMethods.NumberFunction = (x) => x,
        p2: LineMethods.NumberFunction = (x) => x,
    ) {
        return LineMethods.interpolate_lines(line1, line2, f, p1, p2);
    }

    copy_line(l: Line, p1: Point, p2: Point) {
        return LineMethods.copy_line(l, p1, p2);
    }

    merge_lines(
        line1: Line,
        line2: Line,
        delete_join: boolean = false,
        data_callback: CopySketchObjectDataCallback = default_data_callback,
    ) {
        return LineMethods.merge_lines(
            this,
            line1,
            line2,
            delete_join,
            data_callback,
        );
    }

    point_on_line(_pt: Point, _line: Line) {
        throw new Error("Unimplemented");
        // return LineMethods.point_on_line(this, pt, line);
    }

    split_line_at_length(
        _line: Line,
        _length: number,
        _reversed: boolean = false,
    ) {
        throw new Error("Unimplemented");
        // return LineMethods.split_line_at_length(this, line, length, reversed);
    }

    split_line_at_fraction(_line: Line, _fraction: number, _reversed = false) {
        throw new Error("Unimplemented");
        // return LineMethods.split_line_at_fraction(
        //     this,
        //     line,
        //     fraction,
        //     reversed,
        // );
    }

    intersect_lines(_line1: Line, _line2: Line) {
        throw new Error("Unimplemented");
        // return LineMethods.intersect_lines(this, line1, line2);
    }

    line_with_offset(
        _line: Line,
        _offset: number,
        _withHandedness: boolean = true,
    ) {
        throw new Error("Unimplemented");
        // return LineMethods.line_with_offset(this, line, offset, withHandedness);
    }

    // ==== CC Methods

    get_connected_components() {
        const components: ConnectedComponent[] = [];
        const visited_points: Point[] = [];

        for (const p of this.points) {
            if (!visited_points.includes(p)) {
                const new_component = new ConnectedComponent(p);
                components.push(new_component);
                visited_points.push(...new_component.get_points());
            }
        }

        return components;
    }

    get_avoidant_connected_components(se: SketchElement[]) {
        const components: AvoidantConnectedComponent[] = [];
        const visited_points: Point[] = [];

        for (const p of this.points) {
            if (!visited_points.includes(p) && !se.includes(p)) {
                const new_component = new AvoidantConnectedComponent(p, se);
                components.push(new_component);
                visited_points.push(...new_component.get_points());
            }
        }

        for (const l of this.lines) {
            if (se.includes(l.p1) && se.includes(l.p2)) {
                components.push(new AvoidantConnectedComponent(l, se));
            }
        }

        return components;
    }

    // Sewing Sketch stuff
    cut(
        ...args: DropFirst<Parameters<typeof SewingMethods.cut>>
    ): ReturnType<typeof SewingMethods.cut> {
        return SewingMethods.cut(this, ...args);
    }

    glue(
        ...args: DropFirst<Parameters<typeof SewingMethods.glue>>
    ): ReturnType<typeof SewingMethods.glue> {
        return SewingMethods.glue(this, ...args);
    }

    anchor(
        ...args: DropFirst<Parameters<typeof SewingMethods.anchor>>
    ): ReturnType<typeof SewingMethods.anchor> {
        return SewingMethods.anchor(this, ...args);
    }

    remove_anchors(
        ...args: DropFirst<Parameters<typeof SewingMethods.remove_anchors>>
    ): ReturnType<typeof SewingMethods.remove_anchors> {
        return SewingMethods.remove_anchors(this, ...args);
    }

    path_between_points(
        ...args: Parameters<typeof SewingMethods.path_between_points>
    ): ReturnType<typeof SewingMethods.path_between_points> {
        return SewingMethods.path_between_points(...args);
    }

    decompress_components() {
        return SewingMethods.decompress_components(this);
    }

    unfold(
        ...args: DropFirst<Parameters<typeof SewingMethods.unfold>>
    ): ReturnType<typeof SewingMethods.unfold> {
        return SewingMethods.unfold(this, ...args);
    }
}

auto_validate(Sketch);
