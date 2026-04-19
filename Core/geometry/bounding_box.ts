import { Vector } from "./vector";

export class BoundingBox {
    readonly is_empty: boolean;
    readonly width: number;
    readonly height: number;
    readonly top_left: Vector;
    readonly top_right: Vector;
    readonly bottom_left: Vector;
    readonly bottom_right: Vector;

    constructor(
        readonly min_x: number,
        readonly min_y: number,
        readonly max_x: number,
        readonly max_y: number,
    ) {
        const w = this.max_x - this.min_x;
        this.width = Number.isFinite(w) ? w : 0;

        const h = this.max_y - this.min_y;
        this.height = Number.isFinite(h) ? h : 0;

        this.top_left = new Vector(this.min_x, this.min_y);
        this.top_right = new Vector(this.max_x, this.min_y);
        this.bottom_left = new Vector(this.min_x, this.max_y);
        this.bottom_right = new Vector(this.max_x, this.max_y);

        this.is_empty = min_x > max_x;
    }

    static empty() {
        return new BoundingBox(Infinity, Infinity, -Infinity, -Infinity);
    }

    static from_vectors(points: Vector[]) {
        if (points.length === 0) {
            return BoundingBox.empty();
        }

        let min_x = Infinity,
            min_y = Infinity,
            max_x = -Infinity,
            max_y = -Infinity;

        for (const p of points) {
            min_x = Math.min(min_x, p.x);
            min_y = Math.min(min_y, p.y);
            max_x = Math.max(max_x, p.x);
            max_y = Math.max(max_y, p.y);
        }

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

    get center() {
        return new Vector(
            (this.min_x + this.max_x) / 2,
            (this.min_y + this.max_y) / 2,
        );
    }

    static merge(boxes: BoundingBox[]) {
        return BoundingBox.from_vectors(
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
}
