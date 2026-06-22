import { Color } from "@/Core/colors";
import { NumberGrid } from "@/Core/grid";
import { Interval } from "@/Core/numerics";

import { render_grid_with_callback } from "./with_callback";

export function render_number_grid(
    g: NumberGrid,
    img_dimensions: [number, number] = [500, 500],
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
