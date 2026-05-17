import { LineRenderAttributes } from "Core/files/svg/render_attributes";
import * as Color from "../../colors";
import { Line } from "../line";
import { Point } from "../point";

const defaultPointRenderAttributes = {
    stroke: "black" as Color.Color,
    stroke_width: 3,
    fill: "white" as Color.Color,
    opacity: 1,
    radius: 10,
};

export function compute_point_render_attributes(p: Point) {
    return {
        radius: get_value_or_else(
            p.data,
            "radius",
            defaultPointRenderAttributes.radius,
        ),
        fill: get_value_or_else(
            p.data,
            "fill",
            defaultPointRenderAttributes.fill,
        ),
        stroke: get_value_or_else(
            p.data,
            "stroke",
            defaultPointRenderAttributes.stroke,
        ),
        stroke_width: get_value_or_else(
            p.data,
            "stroke_width",
            defaultPointRenderAttributes.stroke_width,
        ),
        opacity: get_value_or_else(
            p.data,
            "opacity",
            defaultPointRenderAttributes.opacity,
        ),
    } as const;
}

const defaultLineRenderAttributes = {
    rh_stroke: [["#ccc", "rgb(0,0,100)"], 3] as [Color.Gradient, number],
    lh_stroke: [["#ccc", "rgb(100,0,0)"], 3] as [Color.Gradient, number],
    stroke_width: 5,
    opacity: 1,
};

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
        stroke_width: get_value_or_else(
            l.data,
            "stroke_width",
            defaultLineRenderAttributes.stroke_width,
        ),
        opacity: get_value_or_else(
            l.data,
            "opacity",
            defaultPointRenderAttributes.opacity,
        ),
    } as const;
}

function get_value_or_else<D>(
    data: Record<string, string>,
    key: string,
    or_else: D,
): D {
    const entry = data[`_style_${key}`];

    if (!entry) return or_else;
    return JSON.parse(entry);
}
