// Note that this file needs to keep in sync with corresponding file in the Embroidery folder

import * as Color from "./compatability/color";
import { Embroidery } from "./compatability/embroidery";
import * as Interval from "./compatability/interval";
import * as LinearTransform from "./compatability/linear_transform";
import { Vector } from "./compatability/vec";

function shadeColor(color: Color.Color, percent: number): Color.Color {
    const hsl = Color.toHsl(color);
    hsl[2] += percent;
    hsl[2] = Interval.clamp([0, 100], hsl[2]);
    return Color.fromHsl(hsl);
}

export type RenderEmbroideryArgs = {
    width?: number;
    height?: number;
    padding?: number;
    crossmark?: boolean;
    start_end_markers?: boolean;
};

type ExtraAnnotation =
    | {
          type: "cursor";
          at: Vector;
      }
    | {
          type: "start" | "end";
          at: Vector;
          color: Color.Color;
      };

export function render_partial_embroidery(
    ctx: CanvasRenderingContext2D,
    embr: Embroidery,
    upto: number,
    args: Partial<RenderEmbroideryArgs> = {},
): void {
    const { widthPx, heightPx, abs_to_px } = recalculate_render_dimensions(
        embr,
        args,
    );

    const canvas = ctx.canvas;
    canvas.width = Math.round(widthPx);
    canvas.height = Math.round(heightPx);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, widthPx, heightPx);

    ctx.lineWidth = abs_to_px(2.5); // 1 = 0.1mm width
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    let stitchesLeft = upto ?? embr.stitch_count();

    const annotations: ExtraAnnotation[] = [];
    let last_position: Vector = embr.bounding_box().center;

    outer: for (const thread of embr.threads) {
        const color = Color.toHexString(
            Color.setLuminocity(Color.setOpacity(thread.color, 0.8), 50),
        );
        const endColor = Color.toHexString(shadeColor(color, -20));
        const midColor = Color.toHexString(shadeColor(color, 20));

        const runs = thread.runs.map((p) => p.map(abs_to_px).verticies);

        for (const run of runs) {
            if (stitchesLeft < 1) break;

            if (run.length > 0) {
                annotations.push({
                    type: "start",
                    color: thread.color,
                    at: run[0]!,
                });

                last_position = run[0]!;
                stitchesLeft--;
            }

            for (let i = 1; i < run.length; i++) {
                if (!stitchesLeft--) {
                    break outer;
                }

                last_position = run[i]!;

                const prevStitch = run[i - 1]!;
                const currStitch = run[i]!;

                const dx = currStitch.x - prevStitch.x;
                const dy = currStitch.y - prevStitch.y;
                const gWidth = Math.sqrt(dx * dx + dy * dy);

                const gradient = ctx.createRadialGradient(
                    prevStitch.x,
                    prevStitch.y,
                    0,
                    prevStitch.x,
                    prevStitch.y,
                    gWidth,
                );

                gradient.addColorStop(0, endColor);
                gradient.addColorStop(0.05, color);
                gradient.addColorStop(0.5, midColor);
                gradient.addColorStop(0.9, color);
                gradient.addColorStop(1, endColor);

                ctx.strokeStyle = gradient;
                ctx.beginPath();
                ctx.moveTo(prevStitch.x, prevStitch.y);
                ctx.lineTo(currStitch.x, currStitch.y);
                ctx.stroke();
            }

            if (run.length > 0) {
                annotations.push({
                    type: "end",
                    color: thread.color,
                    at: run[run.length - 1]!,
                });
            }
        }
    }

    annotations.push({
        type: "cursor",
        at: last_position,
    });

    const markerSize = abs_to_px(30);
    const crossWidth = abs_to_px(6);
    const half = markerSize / 2;

    const triangleBase = markerSize + crossWidth;
    const triangleHeight = triangleBase;

    for (const a of annotations) {
        const at = a.at;

        if (a.type === "cursor" && args.crossmark === true) {
            ctx.save();
            ctx.strokeStyle = "#ff0000";
            ctx.lineWidth = Math.max(1, crossWidth + 2);
            ctx.lineCap = "round";

            // Border
            ctx.beginPath();
            ctx.moveTo(at.x - half, at.y);
            ctx.lineTo(at.x + half, at.y);
            ctx.moveTo(at.x, at.y + half);
            ctx.lineTo(at.x, at.y - half);
            ctx.strokeStyle = "#000000";
            ctx.stroke();

            // Inner cross
            ctx.beginPath();
            ctx.moveTo(at.x - half, at.y);
            ctx.lineTo(at.x + half, at.y);
            ctx.moveTo(at.x, at.y + half);
            ctx.lineTo(at.x, at.y - half);
            ctx.strokeStyle = "#ff0000";
            ctx.lineWidth = Math.max(1, crossWidth);
            ctx.stroke();

            ctx.restore();
        } else if (a.type === "end" && args.start_end_markers === true) {
            draw_triangle(ctx, at, triangleBase, -triangleHeight, "black");
            draw_triangle(
                ctx,
                at,
                triangleBase - 5,
                -triangleHeight + 5,
                a.color,
            );
        } else if (a.type === "start" && args.start_end_markers === true) {
            draw_triangle(ctx, at, triangleBase, triangleHeight, "black");
            draw_triangle(
                ctx,
                at,
                triangleBase - 5,
                triangleHeight - 5,
                a.color,
            );
        }
    }
}

function draw_triangle(
    ctx: CanvasRenderingContext2D,
    at: Vector,
    width: number,
    height: number,
    color: string,
) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(at.x, at.y + (height * 2) / 3);
    ctx.lineTo(at.x - width / 2, at.y - (height * 1) / 3);
    ctx.lineTo(at.x + width / 2, at.y - (height * 1) / 3);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();
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

                return what as any;
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
