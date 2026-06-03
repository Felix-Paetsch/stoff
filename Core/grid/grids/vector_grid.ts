import { Vector } from "Core/geometry/vector";
import { Grid } from "./grid";

export class VectorGrid extends Grid<Vector> {
    override lerp(a: Vector, b: Vector, c: number) {
        return Vector.lerp(a, b, c);
    }
}
