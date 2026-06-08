import { Grid } from "Core/grid/index";
import { UInt8Grid } from "Core/grid/types";
import { RGBImage } from "./rgb";

export class GrayImage {
    constructor(public pixel_grid: UInt8Grid) {
        pixel_grid.remap_domain_in_place([
            0,
            0,
            pixel_grid.dimensions_ref.lattice_dimensions[0] - 1,
            pixel_grid.dimensions_ref.lattice_dimensions[1] - 1,
        ]);
    }

    gray_scale(): GrayImage {
        return new GrayImage(this.pixel_grid.copy());
    }

    as_rgb(): RGBImage {
        return new RGBImage(
            Grid.map("vec3u8", this.pixel_grid, (v) => [v, v, v]),
        );
    }
}
