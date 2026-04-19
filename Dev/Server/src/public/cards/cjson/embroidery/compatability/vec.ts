export class Vector {
    constructor(
        public x: number,
        public y: number,
    ) {}

    add(v: Vector) {
        return new Vector(this.x + v.x, this.y + v.y);
    }

    subtract(v: Vector) {
        return new Vector(this.x - v.x, this.y - v.y);
    }

    scale(s: number) {
        return new Vector(this.x * s, this.y * s);
    }
}
