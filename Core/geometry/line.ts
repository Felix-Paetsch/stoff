import { EPS } from "../numerics";
import { Ray } from "./ray";
import { LineSegment } from "./types";
import { Vector } from "./vector";

export class Line {
    readonly points!: [Vector, Vector];
    constructor(points: LineSegment);
    constructor(p1: Vector, p2: Vector);
    constructor(p1: Vector | LineSegment, p2?: Vector) {
        if (p1 instanceof Array) return new Line(...p1);
        this.points = [p1, p2!];
    }

    static from_direction(vec: Vector, direction: Vector) {
        return new Line(vec, vec.add(direction));
    }

    get_orthogonal(at: Vector = Vector.ZERO) {
        return Line.from_direction(
            at,
            Vector.subtract(this.points[0], this.points[1]).orthogonal(),
        );
    }

    contains(vec: Vector) {
        return EPS.is_zero(vec.distance(this.project(vec)));
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
            vec1.y + projection * vec1ToVec2.y,
        );
    }

    distance(vec: Vector): number {
        return vec.distance(this.project(vec));
    }

    mirror_at(...data: Parameters<typeof Vector.prototype.mirror_at>): Line {
        return new Line(
            this.points.map((p) => p.mirror_at(...data)) as [Vector, Vector],
        );
    }

    to_line() {
        return this.copy();
    }

    copy() {
        return new Line(...this.points);
    }

    intersect(target: Line | Ray | [Vector, Vector]) {
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
        if (EPS.is_zero(Math.abs(denom))) {
            return null;
        }

        // Intersection on this line
        const t = A.subtract(p1).cross(dir2) / denom;
        const point = p1.add(dir1.scale(t));

        // For the other line/segment/ray
        const u = p1.subtract(A).cross(dir1) / -denom;

        if (isSegment && (u < -EPS.tiny || u - EPS.tiny > 1)) return null;
        if (isRay && u < -EPS.tiny) return null;

        return point;
    }

    static HORIZONTAL = new Line(Vector.LEFT, Vector.RIGHT);
    static VERTICAL = new Line(Vector.UP, Vector.DOWN);
}
