import { BooleanGrid } from "@/Core/grid";

import {
    GridRenderDimensionsArgs,
    render_grid_with_callback,
} from "./with_callback";

export function render_boolean_grid(
    g: BooleanGrid,
    img_dimensions: GridRenderDimensionsArgs = null,
) {
    return render_grid_with_callback(
        g,
        (n) => {
            if (n) {
                return "blue";
            } else {
                return "red";
            }
        },
        img_dimensions,
    );
}
