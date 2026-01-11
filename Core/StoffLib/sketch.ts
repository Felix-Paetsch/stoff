import { UP, Vector } from "./geometry";
import { Point } from "./point";
import { Line } from "./line";
import {
    copy_sketch,
    default_data_callback,
    copy_data_callback,
    copy_sketch_obj_data,
    CopySketchDataCallback,
} from "./copy";
import CONF from "./config.json";

import { assert } from "../assert";
import { DropFirst, SketchElement, SketchElementCollection } from "./types";
import { auto_validate } from "./sketch_methods/auto_validate";

import * as LineMethods from "./sketch_methods/line_methods";
import * as RenderingMethods from "../Render/sketch_rendering_methods/exports";
import { line_with_length } from "./unicorns/line_with_length";
import { radians, length } from "./geometry/types";
import { AvoidantConnectedComponent, ConnectedComponent } from "./connected_component";
import path from "path";
import * as CollectionMethods from "./collection";
import * as SewingMethods from "./sketch_methods/advanced_methods/exports";

export class Sketch {
    readonly sample_density = CONF.DEFAULT_SAMPLE_POINT_DENSITY;
    private points: Point[] = [];
    private lines: Line[] = [];
    public data: any = {};

    constructor() { }

    __register_point(pt: Point) {
        this.points.push(pt);
    }

    __register_line(ln: Line) {
        this.lines.push(ln);
    }

    __unregister_point(pt: Point) {
        this.points = this.points.filter(p => p != pt);
    }

    __unregister_line(ln: Line) {
        this.lines = this.lines.filter(l => l != ln);
    }

    get_bounding_box() {
        return CollectionMethods.get_bounding_box(this);
    }

    point(x: number, y: number) {
        const pt = new Point(this, x, y);
        return this.add_point(pt);
    }

    add_point(pt: Vector): Point {
        return new Point(this, pt);
    }

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
        const points_to_remove = [];
        const lines_to_remove = [];

        for (let i = 0; i < els.length; i++) {
            const el = els[i];
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

        lines_to_remove.forEach(l => l.remove());
        points_to_remove.forEach(p => p.remove());
    }

    clear() {
        this.remove(...this.points);
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

        this.remove(pt2);
        return pt1;
    }

    copy_point(point: Point, data_callback = copy_data_callback) {
        const p = this.add_point(point.copy());
        copy_sketch_obj_data(point, p, data_callback);
        return p;
    };

    copy() {
        const new_s = new Sketch();
        return new_s.paste_sketch(this);
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

    has(...els: (Point | Line | ConnectedComponent)[]) {
        for (const el of els) {
            if (
                el instanceof Point
                && !this.points.includes(el)
            ) {
                return false
            } else if (
                el instanceof Line
                && !this.lines.includes(el)
            ) {
                return false
            } else if (
                el instanceof ConnectedComponent
                && !this.has(el.root())
            ) {
                return false
            }
        }

        return true;
    }

    toString() {
        return "[Sketch]" as const;
    }

    // =========== LINE METHODS ==========

    line_between_points(pt1: Point, pt2: Point) {
        return LineMethods.line_between_points(this, pt1, pt2);
    }

    line_with_length(
        original_p1: Point,
        original_p2: Point,
        length: number
    ) {
        return line_with_length(
            this,
            original_p1,
            original_p2,
            length
        );
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
        f_1: LineMethods.NumberFunction | LineMethods.TwoNumberFunction,
    ) {
        return LineMethods.line_from_function_graph(
            this,
            pt1,
            pt2,
            f_1
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

    copy_line(l: Line, p1: Point, p2: Point) {
        return LineMethods.copy_line(l, p1, p2);
    }

    merge_lines(
        line1: Line,
        line2: Line,
        delete_join: boolean = false,
        data_callback: CopySketchDataCallback = default_data_callback
    ) {
        return LineMethods.merge_lines(this, line1, line2, delete_join, data_callback)
    }

    point_on_line(
        pt: Point,
        line: Line,
        data_callback: CopySketchDataCallback = copy_data_callback
    ) {
        return LineMethods.point_on_line(this, pt, line, data_callback)
    }

    split_line_at_length(
        line: Line,
        length: number,
        data_callback: CopySketchDataCallback = copy_data_callback,
        reversed: boolean = false
    ) {
        return LineMethods.split_line_at_length(this, line, length, data_callback, reversed)
    };

    split_line_at_fraction(
        line: Line,
        fraction: number,
        data_callback: CopySketchDataCallback = copy_data_callback,
        reversed = false,
    ) {
        return LineMethods.split_line_at_fraction(this, line, fraction, data_callback, reversed);
    };

    intersect_lines(line1: Line, line2: Line) {
        return LineMethods.intersect_lines(this, line1, line2);
    }

    line_with_offset(
        line: Line,
        offset: number,
        withHandedness: boolean = true,
    ) {
        return LineMethods.line_with_offset(this, line, offset, withHandedness)
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
            if (
                !visited_points.includes(p)
                && !se.includes(p)
            ) {
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



    // Sewing Sketch stuff
    cut(...args: DropFirst<Parameters<typeof SewingMethods.cut>>): ReturnType<typeof SewingMethods.cut> {
        return SewingMethods.cut(this, ...args)
    }

    glue(...args: DropFirst<Parameters<typeof SewingMethods.glue>>): ReturnType<typeof SewingMethods.glue> {
        return SewingMethods.glue(this, ...args)
    }

    anchor(...args: DropFirst<Parameters<typeof SewingMethods.anchor>>): ReturnType<typeof SewingMethods.anchor> {
        return SewingMethods.anchor(this, ...args)
    }

    remove_anchors(...args: DropFirst<Parameters<typeof SewingMethods.remove_anchors>>): ReturnType<typeof SewingMethods.remove_anchors> {
        return SewingMethods.remove_anchors(this, ...args)
    }

    path_between_points(...args: Parameters<typeof SewingMethods.path_between_points>): ReturnType<typeof SewingMethods.path_between_points> {
        return SewingMethods.path_between_points(...args)
    }

    decompress_components() {
        return SewingMethods.decompress_components(this)
    }

    unfold(...args: DropFirst<Parameters<typeof SewingMethods.unfold>>): ReturnType<typeof SewingMethods.unfold> {
        return SewingMethods.unfold(this, ...args)
    }
}

auto_validate(Sketch);
