import { Image, RGBImage } from "Core/image/index";
import img_sharp from "sharp";

export namespace ImageIO {
    export async function load(path: string): Promise<RGBImage> {
        return from_sharp(img_sharp(path));
    }

    export function write(
        path: string,
        img: Image,
        dimensions: [number, number] | null = null,
    ) {
        return sharp(img, dimensions).toFile(path);
    }

    export async function from_sharp(img: img_sharp.Sharp): Promise<RGBImage> {
        const { data, info } = await img
            .toColorspace("rgb")
            .raw()
            .toBuffer({ resolveWithObject: true });

        const res = new Uint8Array(info.width * info.height * 3);

        for (let y = 0; y < info.height; y++) {
            for (let x = 0; x < info.width; x++) {
                const px = y * info.width + x;
                const idx = px * info.channels;
                res[3 * px] = data[idx]!;
                res[3 * px + 1] = data[idx + 1]!;
                res[3 * px + 2] = data[idx + 2]!;
            }
        }

        return new RGBImage(res, [info.width, info.height]);
    }

    export function sharp(
        img: Image,
        dimensions: [number, number] | null = null,
    ) {
        if (!dimensions) {
            dimensions = img.dimensions as any;
        }

        return img_sharp(img.pixels, {
            raw: {
                width: dimensions![0],
                height: dimensions![1],
                channels: 3, // RGB = 3 channels (RGBA would be 4)
            },
        });
    }
}
