import { expect } from "../expect";
import { Sketch } from "./sketch";
import { Line } from "./line";
import { StoffObjectData } from "./types";
import { BoundingBox, Vector } from "../geometry";
import { CollectionMethods } from ".";

export class Point extends Vector {
    private _adjacent_lines: Line[] = [];
    public data: StoffObjectData = {};

    private _is_removed = false;
    constructor(
        private _sketch: Sketch,
        ...args: ConstructorParameters<typeof Vector>
    ) {
        super(...args);

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
        return CollectionMethods.connected_component(this.sketch, this);
    }

    __register_line(line: Line) {
        this._adjacent_lines.push(line);
    }

    __unregister_line(line: Line) {
        this._adjacent_lines = this._adjacent_lines.filter((l) => l !== line);
    }

    adjacent_lines() {
        expect(!this._is_removed, "Point is removed");
        return [...this._adjacent_lines];
    }

    adjacent_points() {
        expect(!this._is_removed, "Point is removed");
        const pt = this._adjacent_lines.map((l) => l.other_endpoint(this));
        return pt.filter((p, i) => pt.indexOf(p) == i);
    }

    bounding_box() {
        return BoundingBox.from_points([this]);
    }

    get sketch() {
        expect(!this._is_removed, "Point is removed");
        return this._sketch;
    }

    get_sketch_elements(): [this] {
        return [this];
    }

    common_lines(point: Point) {
        expect(!this._is_removed, "Point is removed");
        return this._adjacent_lines.filter((l) =>
            point.adjacent_lines().includes(l),
        );
    }

    set(x: number, y: number): Point;
    set(x: Vector): Point;
    set(x: number | Vector, y: number = 0): Point {
        expect(!this._is_removed, "Point is removed");

        if (x instanceof Vector) {
            return this.set(x.x, x.y);
        }

        this._x = x;
        this._y = y;
        this._adjacent_lines.forEach((l) => l.update_shape(l.shape));
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
        expect(!this._is_removed, "Point is already removed");
        this._adjacent_lines.forEach((l) => l.remove());
        this.sketch.__unregister_point(this);
        this._is_removed = true;
    }

    has_lines(...ls: Line[]) {
        for (let i = 0; i < ls.length; i++) {
            if (!this._adjacent_lines.includes(ls[i]!)) return false;
        }
        return true;
    }
}
