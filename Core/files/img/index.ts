import { Color } from "Core/colors";
import { Uint8Grid } from "Core/grid/grids/u8_grid";
import { Vec3UInt8Grid, Vec3UInt8GridArray } from "Core/grid/grids/vec3u8_grid";
import { map_u8 } from "Core/grid/utils/map";
import sharp from "sharp";
import { render } from "./render";

export class Image {
    constructor(
        public pixel_grid: Vec3UInt8Grid,
        public default_dimensions: [number, number] = [500, 500],
    ) {}

    gray_scale(): Uint8Grid {
        return map_u8(this.pixel_grid, (c) =>
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

        const grid = new Uint8Array(info.width * info.height * 3);

        let i = 0;
        for (let y = 0; y < info.height; y++) {
            for (let x = 0; x < info.width; x++) {
                const idx = (y * info.width + x) * info.channels;
                grid[i++] = data[idx]!;
                grid[i++] = data[idx + 1]!;
                grid[i++] = data[idx + 2]!;
            }
        }

        return new Image(
            new Vec3UInt8Grid(
                {
                    lattice_dimensions: [info.width, info.height],
                    domain_dimensions: [0, 0, info.width - 1, info.height - 1],
                },
                new Vec3UInt8GridArray(grid),
            ),
        );
    }
}
