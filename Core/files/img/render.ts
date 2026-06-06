import { createCanvas } from "canvas";
import { Vec3UInt8Grid } from "Core/grid/types";

export type PNGBuffer = Buffer;
export function render(
    g: Vec3UInt8Grid,
    img_dimensions: [number, number] = [500, 500],
): PNGBuffer {
    const [width, height] = img_dimensions;

    if (width <= 4 || height <= 4) {
        throw new Error("img_dimensions must be each >= 5");
    }

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");
    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;

    g = g.with_new_dimensions({
        lattice_dimensions: img_dimensions,
        domain_dimensions: g.dimensions_ref.domain_dimensions,
    });
    g.remap_domain_in_place([0, 0, img_dimensions[0], img_dimensions[1]]);

    for (let py = 0; py < height; py++) {
        for (let px = 0; px < width; px++) {
            const rgb = g.value_at_lattice_point([px, py]);

            const dstIdx = (py * width + px) * 4;
            data[dstIdx] = rgb[0];
            data[dstIdx + 1] = rgb[1];
            data[dstIdx + 2] = rgb[2];
            data[dstIdx + 3] = 255;
            // data[dstIdx + 3] = Math.round(255 * rgba[3]);
        }
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas.toBuffer("image/png");
}
