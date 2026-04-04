import { Line } from "./line";
import { Radians } from "./types";
import { Vector } from "./vector";

export class Ray {
    public src!: Vector;
    public direction!: Vector;
    public line!: Line;

    constructor(src: Vector, direction: Vector);
    constructor(src: [Vector, Vector]);
    constructor(src: Vector | [Vector, Vector], direction?: Vector) {
        if (src instanceof Array) return new Ray(...src);

        this.src = src;
        this.direction = direction!;
        this.line = this.to_line();
    }

    static from_points(src: Vector, passing: Vector) {
        return new Ray(src, passing.subtract(src));
    }

    get_orthogonal(at: Vector = Vector.ZERO): Line {
        return Line.from_direction(
            at,
            this.src.subtract(this.direction).orthogonal(),
        );
    }

    contains(vec: Vector) {
        const p = this.project(vec);
        if (!p.equals(vec)) return false;
        if (p.equals(this.src)) return true;

        const vec_direction = vec.subtract(this.src);
        const angle = Vector.angle(vec_direction, this.direction);

        return Math.abs(angle) < 1; // Either 0 or PI
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
            this.src.add(this.direction).mirror_at(...data),
        );
    }

    to_line() {
        return Line.from_direction(this.src, this.direction);
    }

    intersect(target: Line | Ray | [Vector, Vector]) {
        const pt = this.to_line().intersect(target);
        if (!pt || this.contains(pt)) return pt;
        return null;
    }

    rotate(angle: Radians) {
        return new Ray(this.src, this.direction.rotate(angle));
    }
}
