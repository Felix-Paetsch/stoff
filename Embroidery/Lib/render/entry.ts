import { Interval, LinearTransform, Vector } from "@/Core";
import { createCanvas } from "canvas";
import { Embroidery } from "../embroidery";
import {
    render_partial_embroidery,
    RenderEmbroideryArgs,
} from "./render_partial_embroidery_as_png";

export function render_partial_embroidery_as_png(
    embr: Embroidery,
    upto: number,
    args: Partial<RenderEmbroideryArgs> = {},
): Buffer {
    const { widthPx, heightPx } = recalculate_render_dimensions(embr, args);

    const canvas = createCanvas(widthPx, heightPx);
    const context = canvas.getContext("2d");

    render_partial_embroidery(context, embr, upto, args);

    return canvas.toBuffer("image/png");
}

type RenderDimensionRes = {
    widthPx: number;
    heightPx: number;
    abs_to_px(x: number): number;
    abs_to_px(x: Vector): Vector;
};

function recalculate_render_dimensions(
    embr: Embroidery,
    args: RenderEmbroideryArgs,
): RenderDimensionRes {
    const bb = embr.bounding_box();
    const res: Partial<RenderDimensionRes> = {};

    const padding = args.padding ?? 0;

    if (!args.width) {
        if (!args.height) {
            res.widthPx = bb.width + 2 * padding;
            res.heightPx = bb.height + 2 * padding;

            const offset = new Vector(padding, padding + res.heightPx / 2);
            res.abs_to_px = (what: number | Vector) => {
                if (what instanceof Vector) {
                    return what.add(offset) as any;
                }

                return what;
            };
            return res as any;
        }

        if (bb.width == 0) {
            return {
                widthPx: 100,
                heightPx: args.height,
                abs_to_px: (what: number | Vector) => {
                    if (what instanceof Vector) {
                        return new Vector(
                            50,
                            Interval.remap(
                                [bb.min_y, bb.max_y],
                                [padding, args.height! - padding],
                            )(what.y),
                        ) as any;
                    }

                    return what as any;
                },
            };
        }

        const scaling_factor = (args.height - 2 * padding) / bb.height;
        const new_width = bb.width * scaling_factor;
        const trafo = LinearTransform.affine_linear(
            [bb.top_left, bb.top_right, bb.bottom_left],
            [
                new Vector(padding, padding),
                new Vector(new_width + padding, padding),
                new Vector(padding, args.height - padding),
            ],
        );
        return {
            widthPx: new_width + 2 * padding,
            heightPx: args.height,
            abs_to_px: (x) => {
                if (x instanceof Vector) {
                    return trafo(x) as any;
                }
                return (scaling_factor * x) as any;
            },
        };
    }

    if (!args.height) {
        if (bb.height == 0) {
            return {
                widthPx: args.width,
                heightPx: 100,
                abs_to_px: (what: number | Vector) => {
                    if (what instanceof Vector) {
                        return new Vector(
                            Interval.remap(
                                [bb.min_x, bb.max_x],
                                [padding, args.width! - padding],
                            )(what.x),
                            50,
                        ) as any;
                    }

                    return what as any;
                },
            };
        }

        const scaling_factor = (args.width - 2 * padding) / bb.width;
        const new_height = bb.height * scaling_factor;
        const trafo = LinearTransform.affine_linear(
            [bb.top_left, bb.top_right, bb.bottom_left],
            [
                new Vector(padding, padding),
                new Vector(args.width - padding, padding),
                new Vector(padding, new_height + padding),
            ],
        );
        return {
            widthPx: args.width,
            heightPx: new_height + 2 * padding,
            abs_to_px: (x) => {
                if (x instanceof Vector) {
                    return trafo(x) as any;
                }
                return (scaling_factor * x) as any;
            },
        };
    }

    const innerWidth = args.width - 2 * padding;
    const innerHeight = args.height - 2 * padding;

    const scale = Math.min(innerWidth / bb.width, innerHeight / bb.height);
    const renderedWidth = bb.width * scale;
    const renderedHeight = bb.height * scale;

    const offsetX = padding + (innerWidth - renderedWidth) / 2;
    const offsetY = padding + (innerHeight - renderedHeight) / 2;

    const trafo = LinearTransform.affine_linear(
        [bb.top_left, bb.top_right, bb.bottom_left],
        [
            new Vector(offsetX, offsetY),
            new Vector(offsetX + renderedWidth, offsetY),
            new Vector(offsetX, offsetY + renderedHeight),
        ],
    );

    return {
        widthPx: args.width,
        heightPx: args.height,
        abs_to_px: (x) => {
            if (x instanceof Vector) {
                return trafo(x) as any;
            }

            return (scale * x) as any;
        },
    };
}
