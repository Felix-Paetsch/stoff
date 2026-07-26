import { Interval } from "@/Core/numerics";
import { Color } from "Core/colors";
import { Vec3Grid } from "ProcedualArt/primitives/grid";
import {
    GridRenderDimensionsArgs,
    render_grid_with_callback,
} from "./with_callback";

export function render_vec3_grid(
    g: Vec3Grid,
    img_dimensions: GridRenderDimensionsArgs = null,
) {
    let remap = Interval.remap(
        Interval.cover(
            g
                .values()
                .flat()
                .filter((v) => Math.abs(v) < Infinity),
        ),
        [0, 255],
    );

    return render_grid_with_callback(
        g,
        (n) => {
            if (n.some((v) => isNaN(v))) {
                return "black";
            }

            if (n.some((v) => !isFinite(v))) {
                return "white";
            }

            return Color.fromRgb(n.map(remap) as [number, number, number]);
        },
        img_dimensions,
    );
}
