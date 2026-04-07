import { Vector } from "./vector";

export class BoundingBox {
    public is_empty: boolean = false;
    constructor(
        readonly min_x: number,
        readonly min_y: number,
        readonly max_x: number,
        readonly max_y: number,
    ) {}

    static empty() {
        const bb = new BoundingBox(Infinity, Infinity, -Infinity, -Infinity);
        bb.is_empty = true;
        return bb;
    }

    static from_points(points: Vector[]) {
        if (points.length === 0) {
            return BoundingBox.empty();
        }

        const min_x = Math.min(...points.map((p) => p.x));
        const min_y = Math.min(...points.map((p) => p.y));
        const max_x = Math.max(...points.map((p) => p.x));
        const max_y = Math.max(...points.map((p) => p.y));

        return new BoundingBox(min_x, min_y, max_x, max_y);
    }

    intersects(other: BoundingBox) {
        return (
            this.min_x <= other.max_x &&
            this.max_x >= other.min_x &&
            this.min_y <= other.max_y &&
            this.max_y >= other.min_y
        );
    }

    merge(others: BoundingBox[]) {
        return BoundingBox.merge([this, ...others]);
    }

    center() {
        return new Vector(
            (this.min_x + this.max_x) / 2,
            (this.min_y + this.max_y) / 2,
        );
    }

    static merge(boxes: BoundingBox[]) {
        return BoundingBox.from_points(
            boxes
                .filter((b) => !b.is_empty)
                .flatMap((b) => [
                    b.top_left,
                    b.top_right,
                    b.bottom_left,
                    b.bottom_right,
                ]),
        );
    }

    get width() {
        const r = this.max_x - this.min_x;
        return Number.isFinite(r) ? r : 0;
    }

    get height() {
        const r = this.max_y - this.min_y;
        return Number.isFinite(r) ? r : 0;
    }

    get top_left() {
        return new Vector(this.min_x, this.min_y);
    }

    get top_right() {
        return new Vector(this.max_x, this.min_y);
    }

    get bottom_left() {
        return new Vector(this.min_x, this.max_y);
    }

    get bottom_right() {
        return new Vector(this.max_x, this.max_y);
    }
}
