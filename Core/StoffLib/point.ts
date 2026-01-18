import { BoundingBox, Vector } from "./geometry";
import { ConnectedComponent } from "./connected_component";
import { assert } from "../assert";
import { Sketch } from "./sketch";
import { Line } from "./line";
import { SketchElementData } from "./types";
import { Color } from "../utils/colors";

export type PointRenderAttributes = {
    fill: Color;
    radius: number;
    stroke: Color;
    strokeWidth: number;
    opacity: number;
}

export class Point extends Vector {
    private adjacent_lines: Line[] = [];
    public data: SketchElementData = {};
    public attributes: PointRenderAttributes = {
        fill: "black",
        radius: 2,
        stroke: "black",
        strokeWidth: 1,
        opacity: 1,
    };

    private _is_removed = false;
    constructor(
        private sketch: Sketch,
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

        this.sketch.__register_point(this);
    }

    get is_removed() {
        return this._is_removed;
    }

    vector() {
        return new Vector(this);
    }

    connected_component() {
        assert(!this._is_removed, "Point is removed");
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
            r.set_attributes(this.get_attributes());
            return r;
        }
        return new Vector(this);
    }

    get_tangent_vector(line: Line) {
        assert(!this._is_removed, "Point is removed");
        assert(this.adjacent_lines.includes(line));
        return line.get_tangent_vector(this);
    }

    __register_line(line: Line) {
        this.adjacent_lines.push(line);
    }

    __unregister_line(line: Line) {
        this.adjacent_lines = this.adjacent_lines.filter(l => l !== line);
    }

    get_adjacent_lines() {
        assert(!this._is_removed, "Point is removed");
        return [...this.adjacent_lines];
    }

    get_adjacent_points() {
        assert(!this._is_removed, "Point is removed");
        const pt = this.adjacent_lines.map((l) => l.other_endpoint(this));
        return pt.filter((p, i) => pt.indexOf(p) == i);
    }

    get_sketch() {
        assert(!this._is_removed, "Point is removed");
        return this.sketch;
    }

    other_adjacent_lines(...lines: Line[]) {
        assert(!this._is_removed, "Point is removed");
        for (const line of lines) {
            assert(this.adjacent_lines.includes(line));
        }
        return this.adjacent_lines.filter((l) => lines.indexOf(l) < 0);
    }

    other_adjacent_points(...pts: Point[]) {
        assert(!this._is_removed, "Point is removed");

        const adj = this.get_adjacent_points();
        assert(pts.every(adj.includes));

        return adj.filter((p) => pts.indexOf(p) < 0);
    }

    common_lines(point: Point) {
        assert(!this._is_removed, "Point is removed");
        return this.adjacent_lines.filter((l) =>
            point.get_adjacent_lines().includes(l)
        );
    }

    set(x: number, y: number): Point;
    set(x: Vector): Point;
    set(x: number | Vector, y: number = 0) {
        assert(!this._is_removed, "Point is removed");
        this.adjacent_lines?.forEach((l) => l.cache_update("endpoints"));
        return (super.set as any)(x, y);
    }

    move_to(x: number, y: number): Point;
    move_to(x: Vector): Point;
    move_to(x: number | Vector, y: number = 0) {
        assert(!this._is_removed, "Point is removed");
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

    remove() {
        this.adjacent_lines.forEach(l => l.remove());
        assert(!this._is_removed, "Point is already removed");
        this.sketch.__unregister_point(this);
        this._is_removed = true;
    }

    has_lines(...ls: Line[]) {
        for (let i = 0; i < ls.length; i++) {
            if (!this.adjacent_lines.includes(ls[i])) return false;
        }
        return true;
    }

    get_bounding_box() {
        return new BoundingBox(this.x, this.y, this.x, this.y);
    }
}
