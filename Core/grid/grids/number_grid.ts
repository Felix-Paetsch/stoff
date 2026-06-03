import { lerp } from "Core/geometry/interval";
import { Grid } from "./grid";

export class NumberGrid extends Grid<number> {
    override lerp(a: number, b: number, c: number) {
        return lerp(a, b, c);
    }
}
