import { Embroidery } from "@/ProcArt/embroidery";
import { createCanvas } from "canvas";
import { recalculate_render_dimensions } from "./calculate_render_dimensions";
import { render_partial_embroidery_on_canvas } from "./render_on_canvas";

export type RenderEmbroideryArgs = {
    width?: number;
    height?: number;
    padding?: number;
    crossmark?: boolean;
    start_end_markers?: boolean;
};

export function render_partial_embroidery_png(
    embr: Embroidery,
    upto: number,
    args: Partial<RenderEmbroideryArgs> = {},
): Buffer {
    const { widthPx, heightPx } = recalculate_render_dimensions(embr, args);

    const canvas = createCanvas(widthPx, heightPx);
    const context = canvas.getContext("2d");

    render_partial_embroidery_on_canvas(context, embr, upto, args);

    return canvas.toBuffer("image/png");
}
