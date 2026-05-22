import { Interval } from "Core/geometry/index";
import * as Color from "../../colors";
import { NumberGrid } from "../number_grid";
import { lerp_grid_png } from "./lerp_grid";

export function number_grid_png(
    g: NumberGrid,
    img_dimensions: [number, number] = [500, 500],
): Buffer {
    let remap = Interval.remap(
        Interval.cover(g.values_by_ref()),
        Interval.UnitInterval,
    );

    return lerp_grid_png(
        g,
        (n) => {
            return Color.lerp("black", "white", remap(n));
        },
        img_dimensions,
    );
}
