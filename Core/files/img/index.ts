import { Color } from "Core/colors";
import { Grid } from "Core/grid/index";
import { UInt8Grid, Vec3, Vec3UInt8Grid } from "Core/grid/types";
import sharp from "sharp";
import { render } from "./render";

export class Image {
    constructor(
        public pixel_grid: Vec3UInt8Grid,
        public default_dimensions: [number, number] = [500, 500],
    ) {}

    gray_scale(): UInt8Grid {
        return Grid.map("u8", this.pixel_grid, (c) =>
            Color.toGrayScale(Color.fromRgb(c)),
        );
    }

    render(dimensions: [number, number] = this.default_dimensions) {
        return render(this.pixel_grid, dimensions);
    }

    static async load(path: string): Promise<Image> {
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

        return new Image(
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
}
