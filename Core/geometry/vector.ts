import { EPS } from "../numerics";
import { Line } from "./line";
import * as LinearTransform from "./linear_transformations";
import { MirrorData } from "./linear_transformations";
import { Matrix } from "./matrix";
import { Ray } from "./ray";
import { Radians } from "./types";

export class Vector {
    readonly x!: number;
    readonly y!: number;

    constructor(from: Vector);
    constructor(x: number, y: number);
    constructor(x: number | Vector, y: number = 0) {
        if (x instanceof Vector) {
            y = x.y;
            x = x.x;
        }

        this.x = x;
        this.y = y;
    }

    is_finite() {
        return Number.isFinite(this.x) && Number.isFinite(this.y);
    }

    to_array(): [number, number] {
        return [this.x, this.y];
    }

    to_matrix(): Matrix {
        return Matrix.from_entries(this.x, 0, this.y, 0);
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
            Math.pow(this.x - el.x, 2) + Math.pow(this.y - el.y, 2),
        );
    }

    equals(vec: Vector) {
        return EPS.equals(this.distance(vec), 0);
    }

    static equals(vec1: Vector, vec2: Vector) {
        return vec1.equals(vec2);
    }

    mult(el: number): Vector;
    mult(el: Vector): number;
    mult(el: Matrix): Vector;
    mult(el: number | Vector | Matrix) {
        if (typeof el == "number") {
            return this.scale(el);
        }

        if (el instanceof Vector) {
            return this.dot(el);
        }

        return el.transpose().mult(this);
    }

    scale(a: number) {
        return new Vector(this.x * a, this.y * a);
    }

    invert() {
        return this.scale(-1);
    }

    to_len(a: number) {
        return this.normalize().scale(a);
    }

    add(vec: Vector) {
        return new Vector(this.x + vec.x, this.y + vec.y);
    }

    static add(vec1: Vector, vec2: Vector) {
        return vec1.add(vec2);
    }

    subtract(vec: Vector) {
        return this.add(vec.scale(-1));
    }

    static subtract(vec1: Vector, vec2: Vector) {
        return vec1.subtract(vec2);
    }

    static lerp(vec1: Vector, vec2: Vector, amt: number) {
        return Vector.add(vec1.scale(1 - amt), vec2.scale(amt));
    }

    static lerp_abs(vec1: Vector, vec2: Vector, amt: number) {
        const add = Vector.subtract(vec2, vec1).to_len(amt);
        return vec1.add(add);
    }

    component_wise(fn: (x: number) => number) {
        return new Vector(fn(this.x), fn(this.y));
    }

    static component_wise(vecs: [Vector], fn: (a: [number]) => number): Vector;
    static component_wise(
        vecs: [Vector, Vector],
        fn: (a: [number, number]) => number,
    ): Vector;
    static component_wise(
        vecs: [Vector, Vector, Vector],
        fn: (a: [number, number, number]) => number,
    ): Vector;
    static component_wise(vecs: Vector[], fn: (x: number[]) => number): Vector;
    static component_wise(...args: any[]): Vector {
        return new Vector(
            args[1](args[0].map((v: Vector) => v.x)),
            args[1](args[0].map((v: Vector) => v.y)),
        );
    }

    mirror_at(md: MirrorData): Vector {
        return LinearTransform.mirror(md)(this);
    }

    project_onto(line: Line | Ray) {
        return line.to_line().project(this);
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

    orthogonal() {
        return new Vector(-this.y, this.x);
    }

    orthonormal() {
        return new Vector(-this.y, this.x).normalize();
    }

    static orthogonal(from: Vector, to: Vector) {
        return to.subtract(from).orthogonal();
    }

    toString() {
        return `[${this.x.toFixed(3)}, ${this.y.toFixed(3)}]`;
    }

    toJSON() {
        return this.to_array();
    }

    print() {
        function fmt(n: number) {
            return (n.toString() + "     ").slice(0, 5);
        }

        console.log(`| ${fmt(this.x)} |\n| ${fmt(this.y)} |`);
    }

    rotate(angle: Radians, around: Vector = Vector.ZERO) {
        return LinearTransform.rotate(angle, around)(this);
    }

    static angle(vec1: Vector, vec2: Vector, reference: Vector = Vector.ZERO) {
        vec1 = vec1.subtract(reference);
        vec2 = vec2.subtract(reference);

        const dotProduct = vec1.dot(vec2);
        const lengthsProduct = vec1.length() * vec2.length();

        const cosineTheta = Math.max(
            -1,
            Math.min(1, dotProduct / lengthsProduct),
        );
        const angle = Math.acos(cosineTheta);

        return angle || 0;
    }

    static angle_clockwise(vec1: Vector, vec2: Vector): Radians;
    static angle_clockwise(
        vec1: Vector,
        vec2: Vector,
        reference: Vector,
    ): Radians;
    static angle_clockwise(
        vec1: Vector,
        vec2: Vector,
        offset_range: boolean,
    ): Radians;
    static angle_clockwise(
        vec1: Vector,
        vec2: Vector,
        reference: Vector,
        offset_range: boolean,
    ): Radians;
    static angle_clockwise(
        vec1: Vector,
        vec2: Vector,
        reference: Vector | boolean = Vector.ZERO,
        offset_range: boolean = false,
    ) {
        if (typeof reference == "boolean") {
            offset_range = reference;
            reference = Vector.ZERO;
        }

        vec1 = vec1.subtract(reference);
        vec2 = vec2.subtract(reference);

        const dot = vec1.dot(vec2);
        const cross = vec1.x * vec2.y - vec1.y * vec2.x; // 2D cross product
        let angle = Math.acos(
            Math.min(Math.max(dot / (vec1.length() * vec2.length()), -1), 1),
        );

        if (isNaN(angle)) {
            return Math.PI;
        }

        if (cross < 0) {
            angle = 2 * Math.PI - angle; // Clockwise angle adjustment
        }

        if (angle > Math.PI && !offset_range) angle = angle - 2 * Math.PI;

        return angle;
    }

    static random_orientation() {
        return Vector.UP.rotate(Math.random() * Math.PI * 2);
    }

    static ZERO = new Vector(0, 0);
    static UP = new Vector(0, -1);
    static LEFT = new Vector(-1, 0);
    static RIGHT = new Vector(1, 0);
    static DOWN = new Vector(0, 1);
}
