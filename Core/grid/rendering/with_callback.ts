import { Image } from "@/Core/files";
import * as Color from "Core/colors";
import { Grid } from "../grids/grid";
import { GridValue } from "../grids/types";

export type PNGBuffer = Buffer;
export function render_with_callback<T extends GridValue>(
    g: Grid<T>,
    color_map: (v: T) => Color.Color,
    default_dimensions: [number, number] = [500, 500],
): Image {
    const pixel_grid = g.map(
        (v) =>
            Color.toRgb(color_map(v)).slice(0, 3) as [number, number, number],
    );

    return new Image(pixel_grid, default_dimensions);
}
