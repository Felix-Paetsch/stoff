import { ImageIO, RGBImage } from "@/Core/image";
import { CanvasRenderingContext2D } from "canvas";
import { Embroidery } from "Core/embroidery/embroidery";
import sharp from "sharp";
import {
    render_partial_embroidery_png,
    RenderEmbroideryArgs,
} from "./render_as_png";
import { render_partial_embroidery_on_canvas } from "./render_on_canvas";

export { render_partial_embroidery_png } from "./render_as_png";
export { render_partial_embroidery_on_canvas } from "./render_on_canvas";

export function render_embroidery_png(
    embr: Embroidery,
    args: RenderEmbroideryArgs = {},
) {
    render_partial_embroidery_png(embr, embr.stitch_count(), args);
}

export function render_embroidery_on_canvas(
    ctx: CanvasRenderingContext2D,
    embr: Embroidery,
    args: Partial<{
        padding: number;
        crossmark: boolean;
        start_end_markers: boolean;
    }> = {},
) {
    render_partial_embroidery_on_canvas(ctx, embr, embr.stitch_count(), args);
}

export function render_embroidery(
    embr: Embroidery,
    args: RenderEmbroideryArgs = {},
): Promise<RGBImage> {
    return ImageIO.from_sharp(
        sharp(render_partial_embroidery_png(embr, embr.stitch_count(), args)),
    );
}

export function render_partial_embroidery(
    embr: Embroidery,
    up_to_stitch: number,
    args: RenderEmbroideryArgs = {},
): Promise<RGBImage> {
    return ImageIO.from_sharp(
        sharp(render_partial_embroidery_png(embr, up_to_stitch, args)),
    );
}
