import { Gradient, interpolate_colors, Utils } from "@/Core";
import { BoundingBox, Interval, Radians, Vector } from "../../geometry";
import { SVG_Builder } from "./svg_builder";

export class SVGGradient {
    constructor(
        readonly gradient: Gradient,
        private svgBuilder: SVG_Builder,
    ) {}

    gradient_segment(
        from: Interval.Fraction,
        to: Interval.Fraction,
        orientation:
            | {
                  bounding_box: BoundingBox;
                  orientation: Radians | Vector;
              }
            | {
                  from: Vector;
                  to: Vector;
              },
    ): string {
        const g = [
            interpolate_colors(this.gradient[0], this.gradient[1], from),
            interpolate_colors(this.gradient[0], this.gradient[1], to),
        ];

        let x1: string | number,
            y1: string | number,
            x2: string | number,
            y2: string | number;
        let gradientUnits: string;

        if ("from" in orientation) {
            gradientUnits = "userSpaceOnUse";
            x1 = orientation.from.x;
            y1 = orientation.from.y;
            x2 = orientation.to.x;
            y2 = orientation.to.y;
        } else {
            gradientUnits = "objectBoundingBox";

            const { bounding_box } = orientation;
            const width = bounding_box.width;
            const height = bounding_box.height;

            if (width === 0 || height === 0) {
                return "";
            }

            let dx: number;
            let dy: number;

            if (typeof orientation.orientation === "number") {
                dx = Math.cos(orientation.orientation);
                dy = Math.sin(orientation.orientation);
            } else {
                dx = orientation.orientation.x;
                dy = orientation.orientation.y;
            }

            if (dx === 0 && dy === 0) {
                return "";
            }

            // Convert absolute/user-space direction into objectBoundingBox space.
            // In bbox space, x and y are normalized independently, so preserving
            // the intended visual angle requires scaling by width/height.
            const ndx = dx / width;
            const ndy = dy / height;

            // Extend from the center of the unit box until the line touches the box.
            const scale = 0.5 / Math.max(Math.abs(ndx), Math.abs(ndy));

            const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

            const bx1 = clamp01(0.5 - ndx * scale);
            const by1 = clamp01(0.5 - ndy * scale);
            const bx2 = clamp01(0.5 + ndx * scale);
            const by2 = clamp01(0.5 + ndy * scale);

            x1 = `${bx1 * 100}%`;
            y1 = `${by1 * 100}%`;
            x2 = `${bx2 * 100}%`;
            y2 = `${by2 * 100}%`;
        }

        const id = `gradient_${Utils.unique_string()}`;
        this.svgBuilder.add_def(`<linearGradient
  id="${id}"
  gradientUnits="${gradientUnits}"
  x1="${x1}"
  y1="${y1}"
  x2="${x2}"
  y2="${y2}"
>
  <stop offset="0%" stop-color="${g[0]}" />
  <stop offset="100%" stop-color="${g[1]}" />
</linearGradient>`);

        return id;
    }
}
