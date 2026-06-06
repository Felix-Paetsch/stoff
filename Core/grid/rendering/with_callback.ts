import { Image } from "@/Core/files";
import { Color } from "Core/colors";
import { Grid } from "../index";

export type PNGBuffer = Buffer;
export function render_with_callback<T, N extends string>(
    g: Grid.IGrid<T, N>,
    color_map: (v: T) => Color.Color,
    default_dimensions: [number, number] = [500, 500],
): Image {
    const pixel_grid = Grid.map(
        "vec3u8",
        g,
        (v) =>
            Color.toRgb(color_map(v)).slice(0, 3) as [number, number, number],
    );

    return new Image(pixel_grid, default_dimensions);
}
