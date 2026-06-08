import { Color } from "Core/colors";
import { Grid } from "Core/grid/index";
import { Vec3UInt8Grid } from "Core/grid/types";
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
}
