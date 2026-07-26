import { Color } from "@/Core/colors";
import { Interval } from "@/Core/numerics";
import { NumberGrid } from "ProcedualArt/primitives/grid";

import {
    GridRenderDimensionsArgs,
    render_grid_with_callback,
} from "./with_callback";

export function render_number_grid(
    g: NumberGrid,
    img_dimensions: GridRenderDimensionsArgs = null,
) {
    let remap = Interval.remap(
        Interval.cover(g.values().filter((v) => Math.abs(v) < Infinity)),
        Interval.UnitInterval,
    );

    return render_grid_with_callback(
        g,
        (n) => {
            if (Math.abs(n) < Infinity) {
                return Color.lerp("black", "white", remap(n));
            }
            if (isNaN(n)) {
                return "red";
            }
            if (n > 0) {
                return "blue";
            }
            return "pink";
        },
        img_dimensions,
    );
}
