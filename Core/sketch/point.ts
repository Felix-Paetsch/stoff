import { BoundingBox, Vector } from "../../geometrytry";
import { ConnectedComponent } from "./collection/connected_component";
import { expect } from "../expect";
import { Sketch } from "./sketch";
import { Line } from "./line";
import { StoffObjectData } from "./types";

export class Point extends Vector {
    public adjacent_lines: Line[] = [];
    public data: StoffObjectData = {};

    private _is_removed = false;
    constructor(
        private sketch: Sketch,
        ...args: ConstructorParameters<typeof Vector>
    ) {
        super(...args);

        this.adjacent_lines = [];
        this.data = {};

        this.sketch.__register_point(this);
    }

    get is_removed() {
        return this._is_removed;
    }

    vector() {
        return new Vector(this);
    }

    connected_component() {
        expect(!this._is_removed, "Point is removed");
        return new ConnectedComponent(this);
    }

    override copy(): Vector;
    override copy(sketch: Sketch): Point;
    override copy(sketch?: Sketch) {
        if (sketch) {
            const r = new Point(sketch, this.x, this.y);
            return r;
        }
        return new Vector(this);
    }

    get_tangent_vector(line: Line) {
        expect(!this._is_removed, "Point is removed");
        expect(this.adjacent_lines.includes(line));
        return line.get_tangent_vector(this);
    }

    __register_line(line: Line) {
        this.adjacent_lines.push(line);
    }

    __unregister_line(line: Line) {
        this.adjacent_lines = this.adjacent_lines.filter((l) => l !== line);
    }

    get_adjacent_lines() {
        expect(!this._is_removed, "Point is removed");
        return [...this.adjacent_lines];
    }

    get_adjacent_points() {
        expect(!this._is_removed, "Point is removed");
        const pt = this.adjacent_lines.map((l) => l.other_endpoint(this));
        return pt.filter((p, i) => pt.indexOf(p) == i);
    }

    get_sketch() {
        expect(!this._is_removed, "Point is removed");
        return this.sketch;
    }

    other_adjacent_lines(...lines: Line[]) {
        expect(!this._is_removed, "Point is removed");
        for (const line of lines) {
            expect(this.adjacent_lines.includes(line));
        }
        return this.adjacent_lines.filter((l) => lines.indexOf(l) < 0);
    }

    other_adjacent_points(...pts: Point[]) {
        expect(!this._is_removed, "Point is removed");

        const adj = this.get_adjacent_points();
        expect(pts.every(adj.includes));

        return adj.filter((p) => pts.indexOf(p) < 0);
    }

    common_lines(point: Point) {
        expect(!this._is_removed, "Point is removed");
        return this.adjacent_lines.filter((l) =>
            point.get_adjacent_lines().includes(l),
        );
    }

    set(x: number, y: number): Point;
    set(x: Vector): Point;
    set(x: number | Vector, y: number = 0): Point {
        expect(!this._is_removed, "Point is removed");

        if (x instanceof Vector) {
            return this.set(x.x, x.y);
        }

        this.adjacent_lines?.forEach((l) => l.cache_update("endpoints"));
        this._x = x;
        this._y = y;
        return this;
    }

    move_to(x: number, y: number): Point;
    move_to(x: Vector): Point;
    move_to(x: number | Vector, y: number = 0) {
        expect(!this._is_removed, "Point is removed");
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
        this.adjacent_lines.forEach((l) => l.remove());
        expect(!this._is_removed, "Point is already removed");
        this.sketch.__unregister_point(this);
        this._is_removed = true;
    }

    has_lines(...ls: Line[]) {
        for (let i = 0; i < ls.length; i++) {
            if (!this.adjacent_lines.includes(ls[i]!)) return false;
        }
        return true;
    }

    get_bounding_box() {
        return new BoundingBox(this.x, this.y, this.x, this.y);
    }
}
