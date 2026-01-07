import { UP, Vector } from "./geometry.js";
import Point from "./point.js";
import Line from "./line.js";
import {
    copy_sketch,
    default_data_callback,
    copy_data_callback,
    copy_sketch_obj_data,
    CopySketchDataCallback,
} from "./copy.js";
import CONF from "./config.json";
import SketchElementCollection from "./sketch_element_collection.js";

import assert from "../assert.js";
import { has_sketch } from "./assert_methods/exports.js";
import { SketchElementCollectionLike } from "./types.js";
import auto_validate from "./sketch_methods/auto_validate.js";

import * as LineMethods from "./sketch_methods/line_methods";
import * as RenderingMethods from "./sketch_methods/rendering_methods/exports";
import line_with_length_fn from "./unicorns/line_with_length.js";
import { radians, length } from "./geometry/types.js";
import ConnectedComponent from "./connected_component.js";
import path from "path";

export default class Sketch {
    readonly sample_density = CONF.DEFAULT_SAMPLE_POINT_DENSITY;
    private points = new SketchElementCollection<Point>();
    private lines = new SketchElementCollection<Line>();
    public data: any = {};

    constructor() {
        if (typeof (this as any)._init !== "undefined") {
            // When class is modified externally
            (this as any)._init();
        }
    }

    point(x: number, y: number) {
        const pt = new Point(this, x, y);
        return this.add_point(pt);
    }

    add_point(pt: Point | Vector): Point {
        if (pt instanceof Point) {
            pt.set_sketch(this);
            this.points.push(pt);
            return pt;
        }

        return this.add_point(new Point(this, pt));
    }

    get_points() {
        return this.points;
    }

    get_lines() {
        return this.lines;
    }

    get_sketch() {
        return this;
    }

    remove_line(line: Line) {
        return this.remove_lines(line);
    }

    remove_lines(...lines: Line[]) {
        lines.forEach((l) => {
            assert(has_sketch(l, this));
        });

        for (const line of lines) {
            line.get_endpoints().forEach((p) => p.remove_line(line));
            const rem_line = line as any;
            rem_line.p1 = null;
            rem_line.p2 = null;
            rem_line.sketch = null;
        }
        this.lines = this.lines.filter((l) => !lines.includes(l));
    }

    remove_point(pt: Point) {
        return this.remove_points(pt);
    }

    remove_points(...points: Point[]) {
        points.forEach((p) => {
            assert(has_sketch(p, this));
        });

        for (const pt of points) {
            this.remove_lines(...pt.get_adjacent_lines());
        }
        for (const pt of points) {
            pt.set_sketch(null as any);
            (pt as any).adjacent_lines = [];
        }

        this.points = this.points.filter((p) => !points.includes(p));
    }

    remove(...els: SketchElementCollectionLike[]) {
        const points_to_remove = [];
        const lines_to_remove = [];

        for (let i = 0; i < els.length; i++) {
            const points = els[i].get_points();
            const lines = els[i].get_lines();
            lines_to_remove.push(...lines);
            points_to_remove.push(...points);
        }

        this.remove_lines(...lines_to_remove);
        this.remove_points(...points_to_remove);
    }

    clear() {
        this.remove_points(...this.points);
        this.data = null as any;
    }

    // ===============

    merge_points(pt1: Point, pt2: Point, data_callback = default_data_callback) {
        if (pt1 == pt2) return pt1;
        assert(pt1.equals(pt2));

        copy_sketch_obj_data(pt2, pt1, data_callback);

        pt2.get_adjacent_lines().forEach((line) => {
            if (line.p1 !== pt2) {
                line.set_endpoints(line.p1, pt1);
            } else {
                line.set_endpoints(pt1, line.p2);
            }
        });

        this.remove_points(pt2);
        return pt1;
    }

    copy_point(point: Point, data_callback = copy_data_callback) {
        const p = this.add_point(point.copy());
        copy_sketch_obj_data(point, p, data_callback);
        return p;
    };

    static copy(s: Sketch) {
        const new_s = new Sketch();
        new_s.paste_sketch(s);
    }

    paste_sketch(sketch: Sketch): this;
    paste_sketch(sketch: Sketch, position: Vector): this;
    paste_sketch(sketch: Sketch, data_callback: CopySketchDataCallback): this;
    paste_sketch(sketch: Sketch, data_callback: CopySketchDataCallback, position: Vector): this;
    paste_sketch(
        sketch: Sketch,
        data_callback: Vector | CopySketchDataCallback | null = null,
        position: Vector | null = null
    ) {
        if (data_callback instanceof Vector) {
            position = data_callback;
            data_callback = null;
        }
        if (data_callback == null) {
            data_callback = copy_data_callback;
        }
        copy_sketch(sketch, this, data_callback, position);
        return this;
    }

    toString() {
        return "[Sketch]" as const;
    }

    // =========== LINE METHODS ==========

    line_between_points(pt1: Point, pt2: Point) {
        return LineMethods.line_between_points(this, pt1, pt2);
    }

    line_with_length(...args: any[]) {
        return line_with_length_fn(this, ...args);
    }

    line_at_angle(
        point: Point,
        angle: radians,
        length: length,
        reference_direction: Vector = UP,
        absolute: boolean = false // Whether the direction is pointed from 0 or towards this point
    ) {
        return LineMethods.line_at_angle(
            this,
            point,
            angle,
            length,
            reference_direction,
            absolute
        )
    }

    line_from_function_graph(
        pt1: Point,
        pt2: Point,
        f_1: LineMethods.NumberFunction,
        f_2: LineMethods.NumberFunction | null = null
    ) {
        return LineMethods.line_from_function_graph(
            this,
            pt1,
            pt2,
            f_1,
            f_2
        )
    }

    _line_between_points_from_sample_points(
        pt1: Point,
        pt2: Point,
        sp: Vector[]
    ) {
        return LineMethods._line_between_points_from_sample_points(
            this, pt1, pt2, sp
        )
    }

    interpolate_lines(
        line1: Line,
        line2: Line,
        direction: 0 | 1 | 2 | 3 = 0,
        f: LineMethods.NumberFunction = (x) => x,
        p1: LineMethods.NumberFunction = (x) => x,
        p2: LineMethods.NumberFunction = (x) => x
    ) {
        return LineMethods.interpolate_lines(
            this, line1, line2, direction, f, p1, p2
        )
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

    // Rendering Methods

    to_svg(
        width: number | null = null,
        height: number | null = null,
    ) {
        return RenderingMethods.create_svg_from_sketch(
            this,
            width,
            height
        )
    }

    to_dev_svg(
        width: number | null = null,
        height: number | null = null,
    ) {
        return RenderingMethods.create_dev_svg_from_sketch(
            this,
            width,
            height
        )
    }

    save_as_svg(
        save_to: string,
        width: number | null = null,
        height: number | null = null,
    ) {
        return RenderingMethods.save_as_svg(this, save_to, width, height)
    }

    to_png(
        width: number | null = null,
        height: number | null = null,
    ) {
        return RenderingMethods.create_png_from_sketch(
            this,
            width,
            height
        )
    }

    to_jpg(
        width: number | null = null,
        height: number | null = null,
    ) {
        return RenderingMethods.create_jpg_from_sketch(
            this,
            width,
            height
        )
    }

    save_as_png(
        save_to: string,
        width: number | null = null,
        height: number | null = null,
    ) {
        return RenderingMethods.save_as_png(this, save_to, width, height)
    }

    save_as_jpg(
        save_to: string,
        width: number | null = null,
        height: number | null = null,
    ) {
        return RenderingMethods.save_as_jpg(this, save_to, width, height)
    }

    save_on_A4(
        folder: string
    ) {
        RenderingMethods.toA4printable(this, folder);
        RenderingMethods.save_as_png(
            this,
            path.join(folder, "img.png"),
            CONF.PRINTABLE_WIDTH_CM * CONF.PX_PER_CM,
            CONF.PRINTABLE_HEIGHT_CM * CONF.PX_PER_CM,
        );
    }
}

(Sketch as any).Line = Line;
(Sketch as any).Point = Point;
(Sketch as any).SketchElementCollection = SketchElementCollection;

auto_validate(Sketch);
