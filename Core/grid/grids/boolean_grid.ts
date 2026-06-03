import { Grid } from "./grid";

export class BooleanGrid extends Grid<boolean> {
    override lerp(a: boolean, b: boolean, t: number): boolean {
        if (t <= 0.5) {
            return a;
        }
        return b;
    }
}
