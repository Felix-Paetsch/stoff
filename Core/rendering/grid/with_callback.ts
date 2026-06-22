import { Color } from "@/Core/colors";
import { IGrid, lazy_with_new_dimensions, map_grid } from "@/Core/grid";
import { Image, RGBImage } from "@/Core/image";

export type PNGBuffer = Buffer;
export function render_grid_with_callback<T, N extends string>(
    g: IGrid<T, N>,
    color_map: (v: T) => Color.Color,
    default_dimensions: [number, number] = [500, 500],
): Image {
    const pixel_grid = map_grid(
        "vec3",
        g,
        (v) =>
            Color.toRgb(color_map(v)).slice(0, 3) as [number, number, number],
    );

    const img_grid = lazy_with_new_dimensions(default_dimensions, pixel_grid);

    return new RGBImage(
        new Uint8Array(img_grid.values_ref().flat()),
        img_grid.dimensions().lattice_dimensions,
    );
}
