import { Interval, Vector } from "@/Core/geometry";
import { createCanvas } from "canvas";
import { Vec3Grid } from "Core/grid/grids/vec3_grid";
import { EPS } from "Core/numerics/eps";

export type PNGBuffer = Buffer;
export function render(
    g: Vec3Grid,
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

    const [minX, minY, widthX, heightY] = g.domain_dimensions();
    const w_remap = Interval.remap(
        [-EPS.tiny, width + EPS.tiny],
        [minX, minX + widthX],
    );
    const h_remap = Interval.remap(
        [-EPS.tiny, height + EPS.tiny],
        [minY, minY + heightY],
    );

    for (let py = 0; py < height; py++) {
        const y = h_remap(py);

        for (let px = 0; px < width; px++) {
            const x = w_remap(px);

            const rgb = g.sample_at(new Vector(x, y));

            const dstIdx = (py * width + px) * 4;
            data[dstIdx] = rgb[0];
            data[dstIdx + 1] = rgb[1];
            data[dstIdx + 2] = rgb[2];
            data[dstIdx + 3] = 1;
            // data[dstIdx + 3] = Math.round(255 * rgba[3]);
        }
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas.toBuffer("image/png");
}
