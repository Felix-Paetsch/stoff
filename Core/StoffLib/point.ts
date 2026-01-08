import { BoundingBox, Vector } from "./geometry.js";
import ConnectedComponent from "./connected_component.js";
import assert from "../assert.js";
import SketchElementCollection from "./sketch_element_collection.js";
import Sketch from "./sketch";
import Line from "./line.js";
import { SketchElementCollectionLike, SketchElementData } from "./types.js";
import { Color } from "./colors.js";

type PointRenderAttributes = {
    fill: Color;
    radius: number;
    stroke: Color;
    strokeWidth: number;
    opacity: number;
}

class Point extends Vector implements SketchElementCollectionLike {
    private adjacent_lines: Line[] = [];
    public data: SketchElementData = {};
    public attributes: PointRenderAttributes = {
        fill: "black",
        radius: 2,
        stroke: "black",
        strokeWidth: 1,
        opacity: 1,
    };

    constructor(
        private _sketch: Sketch,
        ...args: ConstructorParameters<typeof Vector>
    ) {
        super(...args);

        this.adjacent_lines = [];
        this.data = {};
        this.attributes = {
            fill: "black",
            radius: 2,
            stroke: "black",
            strokeWidth: 1,
            opacity: 1,
        };

        if (typeof (this as any)._init !== "undefined") {
            (this as any)._init();
        }
    }

    get sketch() {
        return this._sketch;
    }

    vector() {
        return new Vector(this);
    }

    connected_component() {
        return new ConnectedComponent(this);
    }

    set_color(color: Color) {
        this.attributes.fill = color;
        return this;
    }

    get_color() {
        return this.attributes.fill;
    }

    set_attribute<Key extends keyof PointRenderAttributes>(attr: Key, value: PointRenderAttributes[Key]) {
        this.attributes[attr] = value;
        return this;
    }

    get_attribute(attr: keyof PointRenderAttributes) {
        return this.attributes[attr];
    }

    set_attributes(attrs: Partial<PointRenderAttributes>) {
        this.attributes = {
            ...this.attributes,
            ...attrs,
        };
        return this;
    }

    get_attributes(): PointRenderAttributes {
        return {
            ...this.attributes,
        };
    }

    copy(): Vector;
    copy(sketch: Sketch): Point;
    copy(sketch?: Sketch) {
        if (sketch) {
            const r = new Point(sketch, this.x, this.y);
            r.attributes = JSON.parse(JSON.stringify(r.attributes));
            return r;
        }
        return new Vector(this);
    }

    get_tangent_vector(line: Line) {
        assert(this.adjacent_lines.includes(line));
        return line.get_tangent_vector(this);
    }

    add_adjacent_line(line: Line) {
        this.adjacent_lines.push(line);
        return this;
    }

    get_adjacent_line() {
        assert(
            this.adjacent_lines.length < 2,
            "Point has more than one adjacent line."
        );
        return this.adjacent_lines[0];
    }

    get_adjacent_lines() {
        return new SketchElementCollection(this.adjacent_lines, this.sketch);
    }

    get_adjacent_point() {
        const adjacent = this.get_adjacent_points();
        assert(adjacent.length < 2, "Point has more than one adjacent points.");
        return adjacent[0];
    }

    get_adjacent_points() {
        const pt = this.adjacent_lines.map((l) => l.other_endpoint(this));
        return pt.filter((p, i) => pt.indexOf(p) == i);
    }

    get_lines() {
        return new SketchElementCollection(this.adjacent_lines);
    }

    // Used in Collection Elements
    get_points() {
        return new SketchElementCollection([this]);
    }

    get_sketch() {
        return this.sketch;
    }

    other_adjacent_line(...lines: Line[]) {
        const other = this.other_adjacent_lines(...lines);
        assert(
            other.length < 2,
            "Point has more than one other adjacent line."
        );
        return other[0] || null;
    }

    other_adjacent_lines(...lines: Line[]) {
        for (const line of lines) {
            assert(this.adjacent_lines.includes(line));
        }
        return this.adjacent_lines.filter((l) => lines.indexOf(l) < 0);
    }

    other_adjacent_point(...pts: Point[]) {
        const other = this.other_adjacent_points(...pts);
        assert(
            other.length < 2,
            "Point has more than one other adjacent points."
        );
        return other[0] || null;
    }

    other_adjacent_points(...pts: Point[]) {
        return this.get_adjacent_points().filter((p) => pts.indexOf(p) < 0);
    }

    common_line(point: Point) {
        return this.common_lines(point)[0] || null;
    }

    common_lines(point: Point) {
        return this.adjacent_lines.filter((l) =>
            point.get_adjacent_lines().includes(l)
        );
    }

    set(x: number, y: number): Point;
    set(x: Vector): Point;
    set(x: number | Vector, y: number = 0) {
        this.adjacent_lines?.forEach((l) => l.cache_update("endpoints"));
        return (super.set as any)(x, y);
    }

    move_to(x: number, y: number): Point;
    move_to(x: Vector): Point;
    move_to(x: number | Vector, y: number = 0) {
        return (this.set as any)(x, y);
    }

    offset_by(x: number, y: number): Point;
    offset_by(x: Vector): Point;
    offset_by(x: number | Vector, y: number = 0) {
        if (x instanceof Vector) {
            return this.move_to(this.add(x));
        }

        return this.move_to(this.x + x, this.y + y);
    }

    remove_line(l: Line, ignore_not_present: boolean = false) {
        if (!ignore_not_present) {
            assert(this.adjacent_lines.includes(l));
        }
        this.adjacent_lines = this.adjacent_lines.filter((line) => line != l);
        return this;
    }

    remove() {
        this._sketch!.remove(this);
        this._sketch = null as any;
    }

    has_lines(...ls: Line[]) {
        for (let i = 0; i < ls.length; i++) {
            if (!this.adjacent_lines.includes(ls[i])) return false;
        }
        return true;
    }

    set_sketch(s: Sketch) {
        this._sketch = s;
        return this;
    }

    get_bounding_box() {
        return new BoundingBox(this.x, this.y, this.x, this.y);
    }
}

export default Point;
