import { to_embroidery_interface } from "./compatability/embroidery";
import { EmbroideryData } from "./index.js";
import { render_partial_embroidery } from "./render_partial_embroidery_png";

const DEFAULT_CANVAS_WIDTH = 500;
const DEFAULT_CANVAS_HEIGHT = 500;
const DEFAULT_PADDING = 20;

export async function update_embroidery_image(
    e: EmbroideryData,
    at_stitch: number,
) {
    const ctx = e.canvas.getContext("2d");
    if (!ctx) return;

    render_partial_embroidery(
        ctx,
        to_embroidery_interface(e.threads),
        at_stitch,
        {
            width: DEFAULT_CANVAS_WIDTH,
            height: DEFAULT_CANVAS_HEIGHT,
            padding: DEFAULT_PADDING,
            crossmark: true,
            start_end_markers: true,
        },
    );

    e.current_stitch_index = at_stitch;
}
