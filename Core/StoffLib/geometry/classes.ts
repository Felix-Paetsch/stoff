import { rotation_fun, vec_angle } from "./algorithms.js";
import assert from "../../assert.js";
import EPS from "./eps.js";
import { radians } from "./types.js";

export class Vector {
    public x!: number;
    public y!: number;
    public is_column: boolean;

    constructor(
        x: number | Vector,
        y: number = 0,
        column: boolean = true
    ) {
        if (x instanceof Vector) {
            y = x.y;
            column = x.is_column;
            x = x.x;
        }

        if (
            !(typeof x === "number" && isFinite(x)) ||
            !(typeof y === "number" && isFinite(y))
        ) {
            throw new Error("Vector entries are not proper numbers!");
        }

        if (typeof column == "undefined") {
            throw new Error("hey!");
        }

        this.is_column = column;
        this.set(x, y);
    }

    to_array() {
        return [this.x, this.y];
    }

    set(x: number, y: number): Vector;
    set(x: Vector): Vector;
    set(x: number | Vector, y: number = 0): Vector {
        if (x instanceof Vector) {
            return this.set(x.x, x.y);
        }

        this.x = x; // LEFT, RIGHT
        this.y = y; // UP, DOWN
        return this;
    }

    dot(vec: Vector) {
        return this.x * vec.x + this.y * vec.y;
    }

    cross(vec: Vector) {
        return this.x * vec.y - this.y * vec.x;
    }

    distance(el: Line | Ray | Vector) {
        if (el instanceof Line || el instanceof Ray) return el.distance(this);
        return Math.sqrt(
            Math.pow(this.x - el.x, 2) + Math.pow(this.y - el.y, 2)
        );
    }

    equals(vec: Vector, eps: number = EPS.MINY) {
        return this.distance(vec) <= eps;
    }

    mult(el: number): Vector;
    mult(el: Vector): number | Matrix;
    mult(el: Matrix): Matrix;
    mult(el: number | Vector | Matrix) {
        if (typeof el == "number") {
            return this.scale(el);
        }

        if (el instanceof Vector) {
            if (!this.is_column && el.is_column) {
                return this.dot(el);
            }
            if (this.is_column && !el.is_column) {
                return new Matrix(
                    new Vector(this.x * el.x, this.y * el.x),
                    new Vector(this.x * el.y, this.y * el.y)
                );
            }
            // Both are the same, mult piecewise
            return new Vector(this.x * el.x, this.y * el.y, this.is_column);
        }

        return el.transpose().mult(this.transpose()).transpose();
    }

    transpose() {
        return new Vector(this.x, this.y, !this.is_column);
    }

    scale(a: number) {
        return new Vector(this.x * a, this.y * a);
    }

    invert() {
        return this.scale(-1);
    }

    to_len(a: number) {
        (assert as any).CALLBACK("Vector is (almost) 0", () => {
            return this.length() > EPS.STRICT_EQUAL;
        });

        return this.normalize().scale(a);
    }

    add(vec: Vector) {
        return new Vector(this.x + vec.x, this.y + vec.y);
    }

    subtract(vec: Vector) {
        return this.add(vec.scale(-1));
    }

    mirror_at(
        el: Line | Ray | Vector | [Vector, Vector],
        vec2: Vector | null = null
    ): Vector {
        if (el instanceof Line || el instanceof Ray)
            return this.mirror_at(el.project(this));
        if (el instanceof Array) return this.mirror_at(...el);
        if (vec2 instanceof Vector) return this.mirror_at(new Line(el, vec2));

        return el.scale(2).subtract(this);
    }

    project_onto(line: Line | Ray) {
        return line.project(this);
    }

    length() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    length_squared() {
        return this.x * this.x + this.y * this.y;
    }

    distance_squared(vec: Vector) {
        return this.subtract(vec).length_squared();
    }

    normalize() {
        return this.scale(1 / this.length());
    }

    get_orthogonal() {
        return new Vector(-this.y, this.x);
    }

    get_orthonormal() {
        return new Vector(-this.y, this.x).normalize();
    }

    toString() {
        return `[${this.x
            .toString()
            .slice(0, this.x.toString().split(".")[0].length + 4)}, ${this.y
                .toString()
                .slice(0, this.y.toString().split(".")[0].length + 4)}]`;
    }

    toJSON() {
        return this.to_array();
    }

    print() {
        function fmt(n: number) {
            return (n.toString() + "     ").slice(0, 5);
        }

        if (this.is_column) {
            return console.log(`| ${fmt(this.x)} |\n| ${fmt(this.y)} |`);
        }
        console.log(`| ${fmt(this.x)} ${fmt(this.y)} |`);
        return this;
    }

    rotate(angle: radians, around = ZERO) {
        return rotation_fun(around, angle)(this);
    }

    copy() {
        return new Vector(this.x, this.y, this.is_column);
    }
}

export class Matrix {
    // 1, 3
    // 2, 4
    private entries: [number, number, number, number];
    constructor(vec1: Vector, vec2: Vector, column_wise: boolean = true) {
        // Column_wise is for convenience. Otherwise we could check if vec1 and vec2 are rows or columns
        if (column_wise) {
            this.entries = [vec1.x, vec1.y, vec2.x, vec2.y];
        } else {
            this.entries = [vec1.x, vec2.x, vec1.y, vec2.y];
        }
    }

    static from_entries(...entries: [number, number, number, number]) {
        return new Matrix(
            new Vector(entries[0], entries[1]),
            new Vector(entries[2], entries[3])
        );
    }

    static from_row_entries(...entries: [number, number, number, number]) {
        return new Matrix(
            new Vector(entries[0], entries[1]),
            new Vector(entries[2], entries[3]),
            true
        );
    }

    get col1() {
        return new Vector(this.entries[0], this.entries[1]);
    }

    get col2() {
        return new Vector(this.entries[2], this.entries[3]);
    }

    get row1() {
        return new Vector(this.entries[0], this.entries[2]);
    }

    get row2() {
        return new Vector(this.entries[1], this.entries[3]);
    }

    transpose() {
        return Matrix.from_entries(
            this.entries[0], this.entries[2], this.entries[1], this.entries[3]
        )
    }

    print() {
        function fmt(n: number) {
            return (n.toString() + "     ").slice(0, 5);
        }

        console.log(
            `| ${fmt(this.entries[0])} ${fmt(this.entries[2])
            } |\n| ${fmt(this.entries[1])} ${fmt(this.entries[3])
            } |`
        );

        return this;
    }

    scale(a: number) {
        return Matrix.from_entries(
            this.entries[0] * a, this.entries[1] * a, this.entries[2] * a, this.entries[3] * a
        );
    }

    det() {
        return (
            this.entries[0] * this.entries[3] - this.entries[1] * this.entries[2]
        );
    }

    invert() {
        const pre_scaled = Matrix.from_entries(
            this.entries[3], this.entries[1] * -1, this.entries[2] * -1, this.entries[0]
        );
        return pre_scaled.scale(1 / this.det());
    }

    add(m: Matrix) {
        return Matrix.from_entries(
            this.entries[0] + m.entries[0],
            this.entries[1] + m.entries[1],
            this.entries[2] + m.entries[2],
            this.entries[3] + m.entries[3]
        );
    }

    mult(el: Vector): Vector;
    mult(el: number | Matrix): Matrix;
    mult(el: number | Vector | Matrix) {
        if (el instanceof Vector) {
            const col1_scaled = this.col1.scale(el.x);
            const col2_scaled = this.col2.scale(el.y);
            return col1_scaled.add(col2_scaled);
        } else if (el instanceof Matrix) {
            return new Matrix(this.mult(el.col1), this.mult(el.col2));
        } else return this.scale(el);
    }

    toJSON() {
        return [this.col1.toJSON(), this.col2.toJSON()];
    }

    toString() {
        return `[${this.col1.toString()}, ${this.col2.toString()}]`;
    }
}

export class Line {
    private points!: [Vector, Vector];
    constructor(points: [Vector, Vector]);
    constructor(p1: Vector, p2: Vector);
    constructor(p1: Vector | [Vector, Vector], p2?: Vector) {
        if (p1 instanceof Array) return new Line(...p1);
        (assert as any).VEC_NOT_EQUAL(p1, p2);
        this.points = [p1, p2!];
    }

    static from_direction(vec: Vector, direction: Vector) {
        return new Line(vec, vec.add(direction));
    }

    get_orthogonal(at: Vector = ZERO) {
        return Line.from_direction(
            at,
            this.points[0].subtract(this.points[1]).get_orthogonal()
        );
    }

    contains(vec: Vector, eps = EPS.MODERATE) {
        return vec.distance(this.project(vec)) < eps;
    }

    project(vec: Vector) {
        const [vec1, vec2] = this.points;

        const vec1ToVec = vec.subtract(vec1);
        const vec1ToVec2 = vec2.subtract(vec1);

        const projection =
            vec1ToVec.dot(vec1ToVec2) / vec1ToVec2.dot(vec1ToVec2);

        // Calculate the closest point on the line
        return new Vector(
            vec1.x + projection * vec1ToVec2.x,
            vec1.y + projection * vec1ToVec2.y
        );
    }

    distance(vec: Vector): number {
        return vec.distance(this.project(vec));
    }

    mirror_at(...data: Parameters<typeof Vector.prototype.mirror_at>): Line {
        return new Line((this.points.map((p) => p.mirror_at(...data)) as [Vector, Vector]));
    }

    to_line() {
        return this.copy();
    }

    copy() {
        return new Line(...this.points);
    }

    intersect(target: Line | Ray | [Vector, Vector], tolerance = EPS.EXACT) {
        const p1 = this.points[0];
        let p2 = this.points[1];
        let A, B: Vector;
        let isSegment: boolean = false;
        let isRay: boolean = false;

        if (target instanceof Line) {
            A = target.points[0];
            B = target.points[1];
        } else if (Array.isArray(target) && target.length === 2) {
            A = target[0];
            B = target[1];
            isSegment = true; // line segment
        } else if (target instanceof Ray) {
            A = target.src;
            B = A.add(target.direction);
            isRay = true;
        } else {
            return null;
        }

        const dir1 = p2.subtract(p1);
        const dir2 = B.subtract(A);
        const denom = dir1.cross(dir2);

        // Parallel (or nearly)
        if (Math.abs(denom) < EPS.MINY) {
            return null;
        }

        // Intersection on this line
        const t = A.subtract(p1).cross(dir2) / denom;
        const point = p1.add(dir1.scale(t));

        // For the other line/segment/ray
        const u = p1.subtract(A).cross(dir1) / -denom;

        if (isSegment && (u < -tolerance || u - tolerance > 1)) return null;
        if (isRay && u < -tolerance) return null;

        return point;
    }
}

export class Ray {
    public src!: Vector;
    public direction!: Vector;
    public line!: Line;

    constructor(src: Vector, direction: Vector);
    constructor(src: [Vector, Vector]);
    constructor(src: Vector | [Vector, Vector], direction?: Vector) {
        if (src instanceof Array) return new Ray(...src);
        assert(src instanceof Vector && direction instanceof Vector);
        assert(direction!.length() > 0, "Direction is zero!");

        this.src = src;
        this.direction = direction!;
        this.line = this.to_line();
    }

    static from_points(src: Vector, passing: Vector) {
        return new Ray(src, passing.subtract(src));
    }

    get_orthogonal(at: Vector = ZERO): Line {
        return Line.from_direction(at, this.src.subtract(this.direction).get_orthogonal());
    }

    contains(vec: Vector, eps = EPS.MODERATE) {
        const p = this.project(vec);
        if (!p.equals(vec, eps)) return false;
        if (p.equals(this.src, eps)) return true;

        const vec_direction = vec.subtract(this.src);
        const angle = vec_angle(vec_direction, this.direction);

        return Math.abs(angle) < EPS.COARSE; // Either 0* or 180*
    }

    project(vec: Vector) {
        return this.line.project(vec);
    }

    distance(vec: Vector): number {
        const p = this.project(vec);
        if (this.contains(p)) return vec.distance(p);
        return vec.distance(this.src);
    }

    mirror_at(...data: Parameters<typeof Vector.prototype.mirror_at>) {
        return Ray.from_points(
            this.src.mirror_at(...data),
            this.src.add(this.direction).mirror_at(...data)
        );
    }

    to_line() {
        return Line.from_direction(this.src, this.direction);
    }

    intersect(target: Line | Ray | [Vector, Vector], tolerance = EPS.EXACT) {
        const pt = this.to_line().intersect(target, tolerance);
        if (!pt || this.contains(pt, EPS.MODERATE)) return pt;
        return null;
    }

    rotate(angle: radians) {
        return new Ray(this.src, this.direction.rotate(angle));
    }
}

export const ZERO = new Vector(0, 0);
export const UP = new Vector(0, -1);
export const LEFT = new Vector(-1, 0);
export const RIGHT = new Vector(1, 0);
export const DOWN = new Vector(0, 1);

export const VERTICAL = new Line(UP, DOWN);
export const HORIZONTAL = new Line(LEFT, RIGHT);
