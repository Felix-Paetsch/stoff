import { createCanvas } from "canvas";
import * as Color from "Core/colors";
import { Interval, Vector } from "Core/geometry/index";
import { InterpolationGrid } from "../grids/interpolation_grid";

export function lerp_grid_png<T>(
    g: InterpolationGrid<T>,
    color_map: (v: T) => Color.Color,
    img_dimensions: [number, number] = [500, 500],
): Buffer {
    const [width, height] = img_dimensions;

    if (width <= 4 || height <= 4) {
        throw new Error("img_dimensions must be each >= 5");
    }

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");
    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;

    const [minX, minY, widthX, heightY] = g.dimensions();
    const w_remap = Interval.remap([0, width], [minX, minX + widthX]);
    const h_remap = Interval.remap([0, height], [minY, minY + heightY]);

    for (let py = 0; py < height; py++) {
        const y = h_remap(py);

        for (let px = 0; px < width; px++) {
            const x = w_remap(px);

            const v = g.sample_at(new Vector(x, y));
            const color = color_map(v);
            const rgba = Color.toRgb(color);

            const dstIdx = (py * width + px) * 4;
            data[dstIdx] = rgba[0];
            data[dstIdx + 1] = rgba[1];
            data[dstIdx + 2] = rgba[2];
            data[dstIdx + 3] = Math.round(255 * rgba[3]);
        }
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas.toBuffer("image/png");
}
