import { Color } from "Core/colors";
import { LineRenderAttributes } from "Core/files/svg/render_attributes";
import { Line } from "../line";
import { Point } from "../point";
import {
    defaultLineRenderAttributes,
    get_fill,
    get_opacity,
    get_radius,
    get_stroke,
    get_stroke_width,
    get_value_or_else,
} from "./getters";

export function compute_point_render_attributes(p: Point) {
    return {
        radius: get_radius(p),
        fill: get_fill(p),
        stroke: get_stroke(p),
        stroke_width: get_stroke_width(p),
        opacity: get_opacity(p),
    } as const;
}

export function compute_line_render_attributes(l: Line) {
    let stroke: LineRenderAttributes["stroke"] = get_value_or_else(
        l.data,
        "stroke",
        l.right_handed
            ? defaultLineRenderAttributes.rh_stroke
            : defaultLineRenderAttributes.rh_stroke,
    );

    if (stroke instanceof Array && !Color.is_gradient(stroke[0])) {
        stroke = [stroke as any, 3];
    }

    return {
        stroke: stroke,
        stroke_width: get_stroke_width(l),
        opacity: get_opacity(l),
    } as const;
}
