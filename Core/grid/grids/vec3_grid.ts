import { Interval } from "@/Core/geometry";
import { Grid } from "./grid";
import { Vec3 } from "./types";

export class Vec3Grid extends Grid<Vec3> {
    override lerp(v: Vec3, w: Vec3, t: number): Vec3 {
        return [
            Interval.lerp(v[0], w[0], t),
            Interval.lerp(v[1], w[1], t),
            Interval.lerp(v[2], w[2], t),
        ];
    }
}
