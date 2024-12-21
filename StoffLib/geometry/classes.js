import { rotation_fun, vec_angle } from "./algorithms.js";
import { assert } from "../../Debug/validation_utils.js";

export class Vector {
    constructor(x = 0, y = 0, column = true) {
        if (x instanceof Vector){
            y = x.y;
            x = x.x;
        }

        if (
            !(typeof x === 'number' && isFinite(x))
         || !(typeof y === 'number' && isFinite(y))
        ){
            throw new Error("Vector entries are not proper numbers!");
        }

        this.is_column = column;
        this.is_row = !column;

        this.set(x, y);
    }

    to_array(){
        return [this.x, this.y];
    }

    set(x, y) {
        if (x instanceof Vector){
            return this.set(x[0], x[1]);
        }

        this.x = x;
        this.y = y;
        this[0] = x;
        this[1] = y;
        return this;
    }

    dot(vec) {
        return this[0] * vec[0] + this[1] * vec[1];
    }

    cross(vec){
        return this.x * vec.y - this.y * vec.x;
    }

    distance(el) {
        if (el instanceof Line) return Line.distance(el);
        return Math.sqrt(
            Math.pow(this.x - el.x, 2) + Math.pow(this.y - el.y, 2)
        );
    }

    equals(vec, eps = true){
        if (eps == true) eps = 0;
        return this.distance(vec) <= eps
    }

    mult(el) {
        if (typeof el == "number") {
            return this.scale(el);
        }

        if (el instanceof Vector) {
            if (this.is_row && el.is_column) {
                return this.dot(el);
            }
            if (this.is_column && el.is_row) {
                return new Matrix(
                    new Vector(this[0] * el[0], this[1] * el[0]),
                    new Vector(this[0] * el[1], this[1] * el[1])
                );
            }
            // Both are the same, mult piecewise
            return new Vector(this[0] * el[0], this[1] * el[1], this.is_row);
        }

        if (el instanceof Matrix) {
            return el.transpose().mult(this.transpose()).transpose();
        }
    }

    transpose() {
        return new Vector(this.x, this.y, !this.is_column);
    }

    scale(a) {
        return new Vector(this.x * a, this.y * a);
    }

    invert(){
        return this.scale(-1);
    }

    to_len(a){
        if (this.length() < 0.000000000001){
          throw new Error("Vector is (almost) 0");
        }
        return this.normalize().scale(a);
    }

    add(vec) {
        return new Vector(this.x + vec.x, this.y + vec.y);
    }

    subtract(vec) {
        return this.add(vec.scale(-1));
    }

    mirror_at(el, vec2 = null){
        if (el instanceof Line) return this.mirror_at(el.project(this));
        if (el instanceof Array) return this.mirror_at(...el);
        if (vec2 instanceof Vector) return this.mirror_at(new Line(el, vec2));

        return el.scale(2).subtract(this);
    }

    project_onto(line){
        return line.project(this);
    }

    length() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    length_squared() {
        return this.x * this.x + this.y * this.y;
    }

    normalize() {
        return this.scale(1 / this.length());
    }

    get_orthogonal() {
        return new Vector(this.y, -1 * this.x);
    }

    get_orthonormal() {
        return new Vector(this.y, -1 * this.x).normalize();
    }

    toString(){
        return `[${
            this.x.toString().slice(
                0, this.x.toString().split('.')[0].length + 4
            )
        }, ${
            this.y.toString().slice(
                0, this.y.toString().split('.')[0].length + 4
            )
        }]`
    }

    toJSON(){
        return this.to_array();
    }

    print() {
        function fmt(n) {
            return (n.toString() + "     ").slice(0, 5);
        }

        if (this.is_column) {
            return console.log(`| ${fmt(this[0])} |\n| ${fmt(this[1])} |`);
        }
        console.log(`| ${fmt(this[0])} ${fmt(this[1])} |`);
        return this;
    }

    rotate(angle) {
        return rotation_fun(new Vector(0, 0), angle)(this);
    }

    copy(){
      return new Vector(this.x, this.y);
    }
}

export class Matrix {
    constructor(vec1, vec2, column_wise = true) {
        // Column_wise is for convenience. Otherwise we could check if vec1 and vec2 are rows or columns
        if (column_wise) {
            this.col1 = vec1;
            this.col2 = vec2;

            this.row1 = new Vector(this.col1[0], this.col2[0]);
            this.row2 = new Vector(this.col1[1], this.col2[1]);
        } else {
            this.row1 = vec1;
            this.row2 = vec2;

            this.col1 = new Vector(this.row1[0], this.row2[0]);
            this.col2 = new Vector(this.row1[1], this.row2[1]);
        }

        this[0] = this.row1;
        this[1] = this.row2;
    }

    transpose() {
        return new Matrix(
            new Vector(this[0][0], this[1][0]),
            new Vector(this[0][1], this[1][1])
        );
    }

    print() {
        function fmt(n) {
            return (n.toString() + "     ").slice(0, 5);
        }

        console.log(
            `| ${fmt(this.row1[0])} ${fmt(this.row1[1])} |\n| ${fmt(
                this.row2[0]
            )} ${fmt(this.row2[1])} |`
        );

        return this;
    }

    scale(a) {
        return new Matrix(this.row1.scale(a), this.row2.scale(a));
    }

    det() {
        return this[0][0] * this[1][1] - this[0][1] * this[1][0];
    }

    invert() {
        const pre_scaled = new Matrix(
            new Vector(this[1][1], this[0][1] * -1),
            new Vector(this[1][0] * -1, this[0][0])
        );
        return pre_scaled.scale(1 / this.det());
    }

    add(m) {
        return new Matrix(this.col1.add(m.col1), this.col2.add(m.col2));
    }

    mult(el) {
        if (el instanceof Vector) {
            const col1_scaled = this.col1.scale(el[0]);
            const col2_scaled = this.col2.scale(el[1]);
            return col1_scaled.add(col2_scaled);
        } else if (el instanceof Matrix) {
            return new Matrix(this.mult(el.col1), this.mult(el.col2));
        } else return this.scale(el);
    }

    toJSON(){
        return [this.col1.toJSON(), this.col2.toJSON()];
    }

    toString(){
        return `[${ this.col1.toString() }, ${ this.col2.toString() }]]`
    }
}

export class Line {
    constructor(p1, p2){
        if (p1 instanceof Array) return new Line(...p1);
        assert(p1 instanceof Vector && p2 instanceof Vector);
        assert(p1.distance(p2) > 0, "Points can't be identical!");
        this.points = [p1, p2];
    }

    static from_direction(vec, direction){
        return new Line(vec, vec.add(direction));
    }

    get_orthogonal(at = ZERO){
        return Line.from_direction(at, this.points[0].subtract(this.points[1]).get_orthogonal());
    }

    contains(vec){
        return vec.distance(this.project(vec)) < 0.000001;
    }

    project(vec){
        const [vec1, vec2] = this.points;

        const vec1ToVec = vec.subtract(vec1);
        const vec1ToVec2 = vec2.subtract(vec1);

        const projection = vec1ToVec.dot(vec1ToVec2) / vec1ToVec2.dot(vec1ToVec2);

        // Calculate the closest point on the line
        return new Vector(
            vec1.x + projection * vec1ToVec2.x,
            vec1.y + projection * vec1ToVec2.y
        );
    }

    distance(vec){
        return vec.distance(this.project(vec));
    }

    mirror_at(...data){
        return new Line(this.points.map(p => p.mirror_at(...data)));
    }

    to_line(){
        return this;
    }

    intersect(target) {
        const p1 = this.points[0], p2 = this.points[1];
        let A, B, isLine = false, isSegment = false, isRay = false;

        if (target instanceof Line) {
            A = target.points[0]; B = target.points[1]; isLine = true;
        } else if (Array.isArray(target) && target.length === 2) {
            A = target[0]; B = target[1]; isSegment = true; // line segment
        } else if (target instanceof Ray) {
            A = target.src; B = A.add(target.direction); isRay = true;
        } else {
            return null;
        }

        const dir1 = p2.subtract(p1);
        const dir2 = B.subtract(A);
        const denom = dir1.cross(dir2);

        // Parallel (or nearly)
        if (Math.abs(denom) < 1e-12) {
            return null;
        }

        // Intersection on this line
        const t = A.subtract(p1).cross(dir2) / denom;
        const point = p1.add(dir1.scale(t));

        // For the other line/segment/ray
        const u = p1.subtract(A).cross(dir1) / -denom;

        if (isSegment && (u < 0 || u > 1)) return null;
        if (isRay && u < 0) return null;

        return point;
    }
    
}

export class Ray{
    constructor(src, direction){
        if (src instanceof Array) return new Ray(...src);
        assert(src instanceof Vector && direction instanceof Vector);
        assert(direction.length() > 0, "Direction is zero!");

        this.src = src;
        this.direction = direction;
        this.line = this.to_line();
    }

    static from_points(src, passing){
        return new Ray(src, passing.subtract(src));
    }

    get_orthogonal(at = ZERO){
        return Line.from_direction(at, p1.subtract(p2).get_orthogonal());
    }

    contains(vec){
        const p = this.project(vec);
        if (!p.equals(vec, 0.000001)) return false;
        if (p.equals(this.src, 0.000001)) return true;

        const vec_direction = vec.subtract(this.src);
        const angle = vec_angle(vec_direction, this.direction);

        return Math.abs(angle) < 0.001; // Either 0* or 180*
    }

    project(vec){
        return this.line.project(vec);
    }

    distance(vec){
        const p = this.project(vec);
        if (this.contains(p)) return vec.distance(p);
        return vec.distance(this.src);
    }

    mirror_at(...data){
        return Ray.from_points(this.src.mirror_at(...data), this.src.add(this.direction).mirror_at(...data));
    }

    to_line(){
        return Line.from_direction(this.src, this.direction);
    }

    intersect(target){
        const pt = this.to_line().intersect(target);
        if (!pt || this.contains(pt)) return pt;
        return null;
    }
}

export const ZERO = new Vector(0,0);
export const UP = new Vector(0,-1);
export const LEFT = new Vector(-1,0);
export const RIGHT = new Vector(1,0);
export const DOWN = new Vector(0,1);

export const VERTICAL = new Line(UP, DOWN);
export const HORIZONTAL = new Line(LEFT, RIGHT);