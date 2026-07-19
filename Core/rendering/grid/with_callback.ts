import { Color } from "@/Core/colors";
import {
    IGrid,
    map_grid,
    resample_grid,
    resample_grid_square,
} from "@/Core/grid";
import { Image, RGBImage } from "@/Core/image";

export type PNGBuffer = Buffer;

export type GridRenderDimensionsArgs =
    | Partial<{
          width: number;
          height: number;
      }>
    | [number, number]
    | "domain_dimensions"
    | "lattice_dimensions"
    | null;

export function render_grid_with_callback<T, N extends string>(
    g: IGrid<T, N>,
    color_map: (v: T) => Color.Color,
    default_dimensions: GridRenderDimensionsArgs = null,
): Image {
    const renderedGrid = grid_for_render_dimensions(g, default_dimensions);

    const pixelGrid = map_grid(
        "vec3",
        renderedGrid,
        (v) =>
            Color.toRgb(color_map(v)).slice(0, 3) as [number, number, number],
    );

    return new RGBImage(
        new Uint8Array(pixelGrid.values_ref().flat()),
        pixelGrid.dimensions().lattice_dimensions,
    );
}

function grid_for_render_dimensions<T, N extends string>(
    g: IGrid<T, N>,
    dimensions: GridRenderDimensionsArgs,
): IGrid<T, N> {
    // Default: one domain unit corresponds to one pixel.
    if (dimensions === null || dimensions === "domain_dimensions") {
        const [, , width, height] = g.dimensions().domain_dimensions;
        const pixelWidth = Math.max(1, Math.floor(width));
        const pixelHeight = Math.max(1, Math.floor(height));

        return resample_grid(g, [pixelWidth, pixelHeight]);
    }

    // Do not resample: one existing lattice point becomes one pixel.
    if (dimensions === "lattice_dimensions") {
        return g;
    }

    // Explicit [width, height]: preserve neither the domain nor cell aspect
    // ratio; the requested output dimensions are exact.
    if (Array.isArray(dimensions)) {
        const [width, height] = dimensions;

        return resample_grid(g, [
            Math.max(1, Math.floor(width)),
            Math.max(1, Math.floor(height)),
        ]);
    }

    const { width, height } = dimensions;

    // Both dimensions explicitly supplied: exact output size. This may change
    // the displayed aspect ratio.
    if (width !== undefined && height !== undefined) {
        return resample_grid(g, [
            Math.max(1, Math.floor(width)),
            Math.max(1, Math.floor(height)),
        ]);
    }

    // A single specified dimension means square pixels. `resample_grid_square`
    // interprets its argument as the sample count on the smaller domain axis,
    // so convert width/height into that count.
    const [, , domainWidth, domainHeight] = g.dimensions().domain_dimensions;
    const smallerDomainAxis = Math.min(domainWidth, domainHeight);

    if (width !== undefined) {
        const cellSize = domainWidth / Math.max(1, Math.floor(width));
        const smallerAxisSamples = Math.max(
            1,
            Math.floor(smallerDomainAxis / cellSize),
        );

        return resample_grid_square(g, smallerAxisSamples);
    }

    if (height !== undefined) {
        const cellSize = domainHeight / Math.max(1, Math.floor(height));
        const smallerAxisSamples = Math.max(
            1,
            Math.floor(smallerDomainAxis / cellSize),
        );

        return resample_grid_square(g, smallerAxisSamples);
    }

    // `{}` has no requested size, so use the default behavior.
    const pixelWidth = Math.max(1, Math.floor(domainWidth));
    const pixelHeight = Math.max(1, Math.floor(domainHeight));

    return resample_grid(g, [pixelWidth, pixelHeight]);
}
