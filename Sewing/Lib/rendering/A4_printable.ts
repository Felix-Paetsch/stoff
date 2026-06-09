import { SVG_Builder } from "@/Core/files";
import { FiniteGeometry, Vector } from "@/Core/geometry";
import { SketchRendering } from "@/Core/sketch";
import { Out } from "@/Dev";
import { CONF } from "Core/config";
import { Sketch } from "Core/module_loader";

const PX_PER_CM = CONF.PX_PER_CM;

const PRINT_WIDTH_CM = 21;
const PRINT_HEIGHT_CM = 29.7;

const PRINT_WIDTH_PX = PRINT_WIDTH_CM * PX_PER_CM;
const PRINT_HEIGHT_PX = PRINT_HEIGHT_CM * PX_PER_CM;

export function to_A4_printable(
    sketch: Sketch.Sketch,
    padding_cm: number = 1,
): SVG_Builder[] {
    const bb = sketch.bounding_box();
    const svgb = SketchRendering.render(sketch, {
        width: bb.width * PX_PER_CM,
        height: bb.height * PX_PER_CM,
    });

    const print_padding_px = PX_PER_CM * padding_cm;
    const print_width_without_padding_px =
        PRINT_WIDTH_PX - 2 * print_padding_px;
    const print_height_without_padding_px =
        PRINT_HEIGHT_PX - 2 * print_padding_px;

    const width = svgb.width;
    const height = svgb.height;

    const pagesX = Math.ceil(width / print_width_without_padding_px);
    const pagesY = Math.ceil(height / print_height_without_padding_px);

    let res: SVG_Builder[] = [];

    for (let x = 0; x < pagesX; x++) {
        for (let y = 0; y < pagesY; y++) {
            const topLeftX = x * print_width_without_padding_px;
            const topLeftY = y * print_height_without_padding_px;
            const bottomRightX = (x + 1) * print_width_without_padding_px;
            const bottomRightY = (y + 1) * print_height_without_padding_px;

            const new_builder = svgb.copy();

            // No strange opacity things..
            new_builder.render_polygon(
                FiniteGeometry.rectangle(
                    new Vector(
                        topLeftX - print_padding_px,
                        topLeftY - print_padding_px,
                    ),
                    new Vector(
                        bottomRightX + print_padding_px,
                        bottomRightY + print_padding_px,
                    ),
                ),
                {
                    fill: "white",
                    stroke: null,
                    render_priority: -1,
                },
            );

            new_builder.render_polygon(
                FiniteGeometry.rectangle(
                    new Vector(topLeftX, topLeftY),
                    new Vector(bottomRightX, bottomRightY),
                ),
            );

            new_builder.render_text(
                `x: ${x + 1}, y: ${y + 1}`,
                new Vector(topLeftX + 5, topLeftY + 5),
            );
            new_builder.set_dimensions({
                width: PRINT_WIDTH_PX,
                height: PRINT_HEIGHT_PX,
                padding: 0,
                viewbox: [
                    new Vector(
                        topLeftX - print_padding_px,
                        topLeftY - print_padding_px,
                    ),
                    new Vector(
                        bottomRightX + print_padding_px,
                        bottomRightY + print_padding_px,
                    ),
                ],
            });

            Out.put(new_builder);
            res.push(new_builder);
        }
    }

    return res;
}
