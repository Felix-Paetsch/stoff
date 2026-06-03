import { Color } from "Core/colors";
import { Interval } from "Core/geometry/index";
import { Grid } from "../grids/grid";
import { render_with_callback } from "./with_callback";

export function render_number_grid(
    g: Grid<number>,
    img_dimensions: [number, number] = [500, 500],
) {
    let remap = Interval.remap(
        Interval.cover(g.values_ref.filter((v) => Math.abs(v) < Infinity)),
        Interval.UnitInterval,
    );

    return render_with_callback(
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
