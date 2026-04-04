import { LinearTransformation } from "./linear_transformations";
import { Vector } from "./vector";

export class Matrix {
    // 1, 3
    // 2, 4
    private entries: [number, number, number, number];
    constructor(vec1: Vector, vec2: Vector, column_wise: boolean = true) {
        if (column_wise) {
            this.entries = [vec1.x, vec1.y, vec2.x, vec2.y];
        } else {
            this.entries = [vec1.x, vec2.x, vec1.y, vec2.y];
        }
    }

    static from_entries(...entries: [number, number, number, number]) {
        return new Matrix(
            new Vector(entries[0], entries[1]),
            new Vector(entries[2], entries[3]),
        );
    }

    static from_row_entries(...entries: [number, number, number, number]) {
        return new Matrix(
            new Vector(entries[0], entries[1]),
            new Vector(entries[2], entries[3]),
            true,
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
            this.entries[0],
            this.entries[2],
            this.entries[1],
            this.entries[3],
        );
    }

    print() {
        function fmt(n: number) {
            return (n.toString() + "     ").slice(0, 5);
        }

        console.log(
            `| ${fmt(this.entries[0])} ${fmt(
                this.entries[2],
            )} |\n| ${fmt(this.entries[1])} ${fmt(this.entries[3])} |`,
        );

        return this;
    }

    scale(a: number) {
        return Matrix.from_entries(
            this.entries[0] * a,
            this.entries[1] * a,
            this.entries[2] * a,
            this.entries[3] * a,
        );
    }

    det() {
        return (
            this.entries[0] * this.entries[3] -
            this.entries[1] * this.entries[2]
        );
    }

    invert() {
        const pre_scaled = Matrix.from_entries(
            this.entries[3],
            this.entries[1] * -1,
            this.entries[2] * -1,
            this.entries[0],
        );
        return pre_scaled.scale(1 / this.det());
    }

    add(m: Matrix) {
        return Matrix.from_entries(
            this.entries[0] + m.entries[0],
            this.entries[1] + m.entries[1],
            this.entries[2] + m.entries[2],
            this.entries[3] + m.entries[3],
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

    transform(): LinearTransformation {
        return (x: Vector) => {
            return this.mult(x);
        };
    }
}
