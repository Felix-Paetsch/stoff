import { Color } from "Core/colors";
import { Grid } from "Core/grid/index";
import { NumberGrid, UInt8Grid, Vec3UInt8Grid } from "Core/grid/types";
import { GrayImage } from "./grayscale";

export class RGBImage {
    constructor(public pixel_grid: Vec3UInt8Grid) {}

    gray_scale(): GrayImage {
        return new GrayImage(
            Grid.map("u8", this.pixel_grid, (c) =>
                Color.toGrayScale(Color.fromRgb(c)),
            ),
        );
    }

    as_rgb(): RGBImage {
        return new RGBImage(this.pixel_grid.copy());
    }

    rgb_channels(): [UInt8Grid, UInt8Grid, UInt8Grid] {
        return [
            Grid.map("u8", this.pixel_grid, (x) => x[0]),
            Grid.map("u8", this.pixel_grid, (x) => x[1]),
            Grid.map("u8", this.pixel_grid, (x) => x[2]),
        ];
    }

    hsl_channels(): [NumberGrid, NumberGrid, NumberGrid] {
        const hsl_vals = this.pixel_grid
            .values_ref()
            .map((v) => Color.rgb_to_hsl(v));
        const dims = this.pixel_grid.dimensions();

        return [
            Grid.from_array(
                "f64",
                dims,
                hsl_vals.map((v) => v[0]),
            ),
            Grid.from_array(
                "f64",
                dims,
                hsl_vals.map((v) => v[1]),
            ),
            Grid.from_array(
                "f64",
                dims,
                hsl_vals.map((v) => v[2]),
            ),
        ];
    }
}
