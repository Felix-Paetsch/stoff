import { Image } from "@/Core/files";
import { Color } from "Core/colors";
import { Grid } from "../grids/grid";
import { map_vec3_u8 } from "../utils/map";

export type PNGBuffer = Buffer;
export function render_with_callback<T>(
    g: Grid<T>,
    color_map: (v: T) => Color.Color,
    default_dimensions: [number, number] = [500, 500],
): Image {
    const pixel_grid = map_vec3_u8(
        g,
        (v) =>
            Color.toRgb(color_map(v)).slice(0, 3) as [number, number, number],
    );

    return new Image(pixel_grid, default_dimensions);
}
