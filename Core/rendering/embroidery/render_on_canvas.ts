import { Color } from "@/Core/colors";
import { Embroidery } from "@/Core/embroidery";
import { Vector } from "@/Core/geometry";
import { Interval } from "@/Core/numerics";

import { CanvasRenderingContext2D } from "canvas";
import { recalculate_render_dimensions } from "./calculate_render_dimensions";

function shadeColor(color: Color.Color, percent: number): Color.Color {
    const hsl = Color.toHsl(color);
    hsl[2] += percent;
    hsl[2] = Interval.clamp([0, 100], hsl[2]);
    return Color.fromHsl(hsl);
}

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

export function render_partial_embroidery_on_canvas(
    ctx: CanvasRenderingContext2D,
    embr: Embroidery,
    upto: number,
    args: Partial<{
        padding: number;
        crossmark: boolean;
        start_end_markers: boolean;
    }> = {},
): void {
    const canvas = ctx.canvas;

    const { widthPx, heightPx, abs_to_px } = recalculate_render_dimensions(
        embr,
        {
            ...args,
            width: canvas.width,
            height: canvas.height,
        },
    );

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, widthPx, heightPx);

    ctx.lineWidth = abs_to_px(0.025);
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    let stitchesLeft = upto;

    const annotations: ExtraAnnotation[] = [];
    let last_position: Vector = embr.bounding_box().center;

    outer: for (const thread of embr.threads) {
        const color = Color.toHexString(
            Color.setLuminocity(Color.setOpacity(thread.color, 0.8), 50),
        );
        const endColor = Color.toHexString(shadeColor(color, -20));
        const midColor = Color.toHexString(shadeColor(color, 20));

        const runs = thread.runs.map((p) => p.map(abs_to_px).vertices);

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

    if (upto < embr.stitch_count()) {
        annotations.push({
            type: "cursor",
            at: last_position,
        });
    }

    const markerSize = abs_to_px(0.2);
    const crossWidth = abs_to_px(0.06);
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
