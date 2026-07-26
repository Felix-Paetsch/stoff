import { Color } from "Core/colors";
import { GrayImage } from "./grayscale";

export class RGBImage {
    constructor(
        public pixels: Uint8Array,
        public dimensions: [number, number],
    ) {}

    public type = "rgb";

    gray_scale(): GrayImage {
        const res = new Uint8Array(this.pixels.length / 3);
        const pixels = this.pixels;
        for (let i = 0; i < res.length; i += 1) {
            res[i] = Color.toGrayScale(
                Color.fromRgb([
                    pixels[3 * i]!,
                    pixels[3 * i + 1]!,
                    pixels[3 * i + 2]!,
                ]),
            );
        }
        return new GrayImage(res, this.dimensions);
    }

    rgb(): RGBImage {
        return new RGBImage(new Uint8Array(this.pixels), [
            ...this.dimensions,
        ] as [number, number]);
    }

    rgb_channels(): [Uint8Array, Uint8Array, Uint8Array] {
        const res_r = new Uint8Array(this.pixels.length / 3);
        const res_g = new Uint8Array(this.pixels.length / 3);
        const res_b = new Uint8Array(this.pixels.length / 3);
        for (let i = 0; i < this.pixels.length / 3; i += 1) {
            res_r[i] = this.pixels[3 * i]!;
            res_g[i] = this.pixels[3 * i + 1]!;
            res_b[i] = this.pixels[3 * i + 2]!;
        }
        return [res_r, res_g, res_b];
    }

    hsl_channels(): [Uint8Array, Uint8Array, Uint8Array] {
        const res_h = new Uint8Array(this.pixels.length / 3);
        const res_s = new Uint8Array(this.pixels.length / 3);
        const res_l = new Uint8Array(this.pixels.length / 3);
        for (let i = 0; i < this.pixels.length / 3; i += 1) {
            const hsl = Color.rgb_to_hsl([
                this.pixels[3 * i]!,
                this.pixels[3 * i + 1]!,
                this.pixels[3 * i + 2]!,
            ]);
            res_h[i] = hsl[0];
            res_s[i] = hsl[1];
            res_l[i] = hsl[2];
        }
        return [res_h, res_s, res_l];
    }
}
