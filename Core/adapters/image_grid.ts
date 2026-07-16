import {
    grid_from_array,
    join_number_grids,
    NumberGrid,
    Vec3Grid,
} from "@/Core/grid";
import { GrayImage, Image, RGBImage } from "@/Core/image";
import { Color } from "../colors";

export function image_to_rgb_grids(
    i: Image,
): [NumberGrid, NumberGrid, NumberGrid] {
    return i
        .rgb()
        .rgb_channels()
        .map((c) =>
            grid_from_array(
                "number",
                {
                    lattice_dimensions: i.dimensions,
                    domain_dimensions: [
                        0,
                        0,
                        i.dimensions[0] - 1,
                        i.dimensions[1] - 1,
                    ],
                },
                c,
            ),
        ) as [NumberGrid, NumberGrid, NumberGrid];
}

export function image_to_rgb_grid(i: Image): Vec3Grid {
    return join_number_grids(...image_to_rgb_grids(i));
}

export function image_to_hsl_grids(
    i: Image,
): [NumberGrid, NumberGrid, NumberGrid] {
    return i
        .rgb()
        .hsl_channels()
        .map((c) =>
            grid_from_array(
                "number",
                {
                    lattice_dimensions: i.dimensions,
                    domain_dimensions: [
                        0,
                        0,
                        i.dimensions[0] - 1,
                        i.dimensions[1] - 1,
                    ],
                },
                c,
            ),
        ) as [NumberGrid, NumberGrid, NumberGrid];
}

export function image_to_hsl_grid(i: Image): Vec3Grid {
    return join_number_grids(...image_to_hsl_grids(i));
}

export function image_to_grayscale_grid(i: Image): NumberGrid {
    return grid_from_array(
        "number",
        {
            lattice_dimensions: i.dimensions,
            domain_dimensions: [0, 0, i.dimensions[0] - 1, i.dimensions[1] - 1],
        },
        i.gray_scale().pixels,
    );
}

export function rgb_grids_to_image(
    r: NumberGrid,
    g: NumberGrid,
    b: NumberGrid,
): RGBImage {
    return rgb_grid_to_image(join_number_grids(r, g, b));
}

export function rgb_grid_to_image(i: Vec3Grid): RGBImage {
    return new RGBImage(
        new Uint8Array(i.values_ref().flat()),
        i.dimensions().lattice_dimensions,
    );
}

export function hsl_grids_to_image(
    h: NumberGrid,
    s: NumberGrid,
    l: NumberGrid,
): RGBImage {
    return hsl_grid_to_image(join_number_grids(h, s, l));
}

export function hsl_grid_to_image(i: Vec3Grid): RGBImage {
    return new RGBImage(
        new Uint8Array(
            i.values_ref().flatMap((v) => {
                const c = Color.hsl_to_rgb(v);
                return [c[0], c[1], c[2]];
            }),
        ),
        i.dimensions().lattice_dimensions,
    );
}

export function grayscale_grid_to_image(i: NumberGrid): GrayImage {
    return new GrayImage(
        new Uint8Array(i.values_ref()),
        i.dimensions().lattice_dimensions,
    );
}
