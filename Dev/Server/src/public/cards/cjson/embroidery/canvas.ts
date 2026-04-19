import { EmbroideryData } from "./embroidery.js";

const DEFAULT_CANVAS_WIDTH = 500;
const DEFAULT_CANVAS_HEIGHT = 500;
const DEFAULT_PADDING = 20;

type Point = [number, number];

type RenderConfig = {
    width: number;
    height: number;
    padding: number;
};

export async function update_embroidery_image(
    e: EmbroideryData,
    at_stitch: number,
) {
    const ctx = e.canvas.getContext("2d");
    if (!ctx) return;

    const img_buffer = e.embr.render_partial_png(at_stitch, {
        width: DEFAULT_CANVAS_WIDTH,
        height: DEFAULT_CANVAS_HEIGHT,
        padding: DEFAULT_PADDING,
    });

    const blob = new Blob([new Uint8Array(img_buffer)], {
        type: "image/png",
    });
    const bitmap = await createImageBitmap(blob);

    ctx.clearRect(0, 0, e.canvas.width, e.canvas.height);
    ctx.drawImage(bitmap, 0, 0);
    bitmap.close();

    e.current_stitch_index = at_stitch;
}
