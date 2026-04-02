import { SVG_Builder } from "@/Core/files/svg/svg_builder";
import { Vector } from "@/Core/geometry";
import { Polygon } from "@/Core/geometry/shapes/polygon";
import CONF from "../../../config.json" with { type: "json" };

const PX_PER_CM = CONF.PX_PER_CM;
const UNITS_PER_CM = CONF.UNITS_PER_CM;
const PX_PER_UNIT = PX_PER_CM / UNITS_PER_CM;

const PRINT_WIDTH_CM = 21;
const PRINT_HEIGHT_CM = 29.7;

const PRINT_WIDTH_PX = PRINT_WIDTH_CM * PX_PER_CM;
const PRINT_HEIGHT_PX = PRINT_HEIGHT_CM * PX_PER_CM;

export function to_A4_printable(
    svgb: SVG_Builder,
    padding: number,
): SVG_Builder[] {
    const print_padding_px = PX_PER_CM * padding;
    const print_width_without_padding_px =
        PRINT_WIDTH_PX - 2 * print_padding_px;
    const print_height_without_padding_px =
        PRINT_HEIGHT_PX - 2 * print_padding_px;

    const width = svgb.width * PX_PER_UNIT;
    const height = svgb.height * PX_PER_UNIT;

    const pagesX = Math.ceil(width / print_width_without_padding_px);
    const pagesY = Math.ceil(height / print_height_without_padding_px);

    let res: SVG_Builder[] = [];

    for (let x = 0; x < pagesX; x++) {
        for (let y = 0; y < pagesY; y++) {
            const topLeftX = x * print_width_without_padding_px;
            const topLeftY = y * print_height_without_padding_px;
            const bottomRightX = (x + 1) * print_width_without_padding_px;
            const bottomRightY = (y + 1) * print_width_without_padding_px;

            const new_builder = svgb.copy();
            new_builder.render_polygon(
                Polygon.rectangle(
                    new Vector(topLeftX, topLeftY),
                    new Vector(bottomRightX, bottomRightY),
                ),
            );

            new_builder.render_text(
                `x: ${x}, y: ${y}`,
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
        }
    }

    return res;
}
