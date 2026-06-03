import { Color } from "Core/colors";
import { Expect } from "Core/expect";
import { Grid } from "Core/grid/grids/grid";
import { NumberGrid } from "Core/grid/grids/number_grid";
import { Vec3 } from "Core/grid/grids/types";
import { Vec3Grid } from "Core/grid/grids/vec3_grid";
import sharp from "sharp";
import { render } from "./render";

export class Image {
    constructor(
        public pixel_grid: Vec3Grid,
        public default_dimensions: [number, number] = [500, 500],
    ) {}

    gray_scale(): NumberGrid {
        return this.pixel_grid.map((c) => Color.toGrayScale(Color.fromRgb(c)));
    }

    is_valid(): boolean {
        return this.pixel_grid.values_ref.every((n) =>
            n.every((v) => 0 <= v && v <= 255),
        );
    }

    render(dimensions: [number, number] = this.default_dimensions) {
        Expect.that(this.is_valid());
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
            Grid.from(
                {
                    lattice_dimensions: [info.width, info.height],
                    domain_dimensions: [0, 0, info.width - 1, info.height - 1],
                },
                grid,
            ),
            [info.width, info.height],
        );
    }
}
