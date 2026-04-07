import { Vector } from "../vector";
import { vectors_from_polyline_function } from "./algorithms/from_function";
import { Polyline } from "./polyline";
import { Shape } from "./shape";

export class Polygon extends Shape {
    constructor(positions: Float64Array | Vector[]) {
        super(positions);
    }

    to_polyline() {
        const l = this.positions.length;

        if (this.positions.length < 2) {
            return new Polyline(this.positions);
        }

        const newArray = new Float64Array(l + 2);
        newArray.set(this.positions);
        newArray[l] = this.positions[0]!;
        newArray[l + 1] = this.positions[1]!;

        return new Polyline(newArray);
    }

    static from_verticies(vec: Vector[]): Polygon {
        const length = vec.length * 2;
        const positions = new Float64Array(length);

        let idx = 0;
        // Fill from loops, calculations, etc.
        for (const vertex of vec) {
            positions[idx++] = vertex.x;
            positions[idx++] = vertex.y;
        }

        return new Polygon(positions);
    }

    map(
        fn: (vec: Vector, len_rel: number, len_abs: number) => Vector,
    ): Polygon {
        const res: Vector[] = [];

        const ver = this.verticies;
        const l = this.length();
        let current_l = 0;

        for (let i = 0; i < ver.length; i++) {
            res.push(fn(ver[i]!, current_l / l, current_l));
        }

        return Polygon.from_verticies(res);
    }

    root() {
        return this.verticies.length > 0 ? this.verticies[0] : null;
    }

    static override from_function(fn: Shape.PolylineFunction): Polygon {
        const vectors = vectors_from_polyline_function(fn);
        // First use polyine to get rid of potential duplicate point at the end
        return new Polyline(vectors).as_polygon();
    }
}
