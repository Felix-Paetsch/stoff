import { Grid } from "Core/grid/index";
import { Vec3 } from "Core/grid/types";
import { RGBImage } from "Core/image/index";
import { Image } from "Core/image/types";
import { writeFile } from "node:fs/promises";
import sharp from "sharp";
import { render_to_png } from "./render";

export namespace ImageIO {
    export async function load(path: string): Promise<RGBImage> {
        const { data, info } = await sharp(path)
            .removeAlpha()
            .raw()
            .toBuffer({ resolveWithObject: true });

        const grid: Vec3[] = [];

        for (let y = 0; y < info.height; y++) {
            for (let x = 0; x < info.width; x++) {
                const idx = (y * info.width + x) * info.channels;
                grid.push([data[idx]!, data[idx + 1]!, data[idx + 2]!]);
            }
        }

        return new RGBImage(
            Grid.from_array(
                "vec3u8",
                {
                    lattice_dimensions: [info.width, info.height],
                    domain_dimensions: [0, 0, info.width - 1, info.height - 1],
                },
                grid,
            ),
        );
    }

    export function write(
        path: string,
        img: Image,
        dimensions: [number, number] | null = null,
    ) {
        writeFile(path, render(img, dimensions));
    }

    export function render(
        img: Image,
        dimensions: [number, number] | null = null,
    ) {
        return render_to_png(
            img.as_rgb().pixel_grid,
            dimensions || img.pixel_grid.dimensions_ref.lattice_dimensions,
        );
    }
}
