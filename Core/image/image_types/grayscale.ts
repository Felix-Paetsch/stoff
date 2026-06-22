import { RGBImage } from "./rgb";

export class GrayImage {
    constructor(
        public pixel_grid: Uint8Array,
        public dimensions: [number, number],
    ) {}

    as_gray_scale(): GrayImage {
        return new GrayImage(new Uint8Array(this.pixel_grid), [
            ...this.dimensions,
        ] as [number, number]);
    }

    as_rgb(): RGBImage {
        const res = new Uint8Array(this.pixel_grid.length * 3);
        for (let i = 0; i < res.length; i += 1) {
            const px = this.pixel_grid[i]!;
            res[i] = px;
            res[++i] = px;
            res[++i] = px;
        }
        return new RGBImage(res, this.dimensions);
    }
}
