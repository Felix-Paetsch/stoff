import { Image, RGBImage } from "ProcedualArt/image/index";
import sharp from "sharp";

export namespace ImageIO {
    export async function load(pathOrUrl: string): Promise<RGBImage> {
        const input = is_url(pathOrUrl)
            ? await fetch_image(pathOrUrl)
            : is_svg_string(pathOrUrl)
              ? Buffer.from(pathOrUrl)
              : pathOrUrl;

        return from_sharp(sharp(input));
    }

    export function write(
        path: string,
        img: Image,
        dimensions: [number, number] | null = null,
    ) {
        return to_sharp(img, dimensions).toFile(path);
    }

    export async function from_sharp(img: sharp.Sharp): Promise<RGBImage> {
        const { data, info } = await img
            .toColourspace("srgb")
            .removeAlpha()
            .raw()
            .toBuffer({ resolveWithObject: true });

        const pixels = new Uint8Array(info.width * info.height * 3);

        for (let px = 0; px < info.width * info.height; px++) {
            const src = px * info.channels;
            const dst = px * 3;

            if (info.channels === 1) {
                const value = data[src]!;
                pixels[dst] = value;
                pixels[dst + 1] = value;
                pixels[dst + 2] = value;
            } else {
                pixels[dst] = data[src]!;
                pixels[dst + 1] = data[src + 1]!;
                pixels[dst + 2] = data[src + 2]!;
            }
        }

        return new RGBImage(pixels, [info.width, info.height]);
    }

    export function to_sharp(
        img: Image,
        dimensions: [number, number] | null = null,
    ) {
        const [width, height] = img.dimensions;
        const channels = img.type === "b-w" ? 1 : 3;

        let image = sharp(img.pixels, {
            raw: {
                width,
                height,
                channels,
            },
        });

        if (dimensions !== null) {
            image = image.resize({
                width: dimensions[0],
                height: dimensions[1],
                fit: "fill",
            });
        }

        return image;
    }
}

function is_url(value: string): boolean {
    try {
        const url = new URL(value);
        return url.protocol === "http:" || url.protocol === "https:";
    } catch {
        return false;
    }
}

function is_svg_string(value: string): boolean {
    return /^\s*(?:<\?xml[^>]*>\s*)?<svg\b/i.test(value);
}

async function fetch_image(url: string): Promise<Buffer> {
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(
            `Failed to fetch image: ${response.status} ${response.statusText}`,
        );
    }

    return Buffer.from(await response.arrayBuffer());
}
