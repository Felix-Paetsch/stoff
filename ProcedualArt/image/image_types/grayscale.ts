import { RGBImage } from "./rgb";

export class GrayImage {
    constructor(
        public pixels: Uint8Array,
        public dimensions: [number, number],
    ) {}

    public type = "b-w";

    gray_scale(): GrayImage {
        return new GrayImage(new Uint8Array(this.pixels), [
            ...this.dimensions,
        ] as [number, number]);
    }

    rgb(): RGBImage {
        const res = new Uint8Array(this.pixels.length * 3);
        for (let i = 0; i < res.length; i += 1) {
            const px = this.pixels[i]!;
            res[i] = px;
            res[++i] = px;
            res[++i] = px;
        }
        return new RGBImage(res, this.dimensions);
    }
}
