import { Vector } from "./classes.js";

export class BoundingBox {
    constructor(
        readonly min_x: number,
        readonly min_y: number,
        readonly max_x: number,
        readonly max_y: number,
        readonly min_bb: [number, number] = [0, 0]
    ) { }

    static empty(min_bb: [number, number] = [0, 0]) {
        return new BoundingBox(0, 0, 0, 0, min_bb);
    }

    static from_points(points: Vector[], min_bb: [number, number] = [0, 0]) {
        const min_x = Math.min(...points.map(p => p.x));
        const min_y = Math.min(...points.map(p => p.y));
        const max_x = Math.max(...points.map(p => p.x));
        const max_y = Math.max(...points.map(p => p.y));
        return new BoundingBox(min_x, min_y, max_x, max_y, min_bb);
    }

    intersects(other: BoundingBox) {
        return this.min_x <= other.max_x && this.max_x >= other.min_x &&
            this.min_y <= other.max_y && this.max_y >= other.min_y;
    }

    merge(...others: BoundingBox[]) {
        return BoundingBox.from_points(
            [...others, this].flatMap(b => [b.top_left, b.top_right, b.bottom_left, b.bottom_right])
        );
    }

    center() {
        return new Vector((this.min_x + this.max_x) / 2, (this.min_y + this.max_y) / 2);
    }

    with_min_bb(min_bb: [number, number]) {
        return new BoundingBox(this.min_x, this.min_y, this.max_x, this.max_y, min_bb);
    }

    static merge(...boxes: BoundingBox[]) {
        return BoundingBox.from_points(
            boxes.flatMap(b => [b.top_left, b.top_right, b.bottom_left, b.bottom_right]),
            boxes[0].min_bb
        );
    }

    get width() {
        return Math.max(this.actual_width, this.min_bb[0]);
    }

    get height() {
        return Math.max(this.actual_height, this.min_bb[1]);
    }

    get top_left() {
        return new Vector(
            this.min_x - adjust_for_minimial_bb(this.min_bb[0], this.actual_width),
            this.min_y - adjust_for_minimial_bb(this.min_bb[1], this.actual_height)
        );
    }

    get top_right() {
        return new Vector(
            this.max_x + adjust_for_minimial_bb(this.min_bb[0], this.actual_width),
            this.min_y - adjust_for_minimial_bb(this.min_bb[1], this.actual_height)
        );
    }

    get bottom_left() {
        return new Vector(
            this.min_x - adjust_for_minimial_bb(this.min_bb[0], this.actual_width),
            this.max_y + adjust_for_minimial_bb(this.min_bb[1], this.actual_height)
        );
    }

    get bottom_right() {
        return new Vector(
            this.max_x + adjust_for_minimial_bb(this.min_bb[0], this.actual_width),
            this.max_y + adjust_for_minimial_bb(this.min_bb[1], this.actual_height)
        );
    }

    get actual_width() {
        return this.max_x - this.min_x;
    }

    get actual_height() {
        return this.max_y - this.min_y;
    }

    get actual_top_left() {
        return new Vector(this.min_x, this.min_y);
    }

    get actual_top_right() {
        return new Vector(this.max_x, this.min_y);
    }

    get actual_bottom_left() {
        return new Vector(this.min_x, this.max_y);
    }

    get actual_bottom_right() {
        return new Vector(this.max_x, this.max_y);
    }
}

function adjust_for_minimial_bb(min_value: number, actual_value: number) {
    return Math.max(0, (min_value - actual_value)) / 2;
}