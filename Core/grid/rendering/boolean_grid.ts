import { BooleanGrid } from "../types";
import { render_with_callback } from "./with_callback";

export function render_boolean_grid(
    g: BooleanGrid,
    img_dimensions: [number, number] = [500, 500],
) {
    return render_with_callback(
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
