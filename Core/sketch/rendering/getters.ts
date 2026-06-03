import { Color } from "Core/colors";
import { Line } from "../line";
import { Point } from "../point";
import { SketchElement } from "../types";

import { LineRenderAttributes, PointRenderAttributes } from "./styles";

export const defaultPointRenderAttributes = {
    stroke: "black" as Color.Color,
    stroke_width: 3,
    fill: "white" as Color.Color,
    opacity: 1,
    radius: 10,
};

export const defaultLineRenderAttributes = {
    stroke: "black" as const,
    rh_stroke: [["#ccc", "rgb(0,0,100)"], 3] as [Color.Gradient, number],
    lh_stroke: [["#ccc", "rgb(100,0,0)"], 3] as [Color.Gradient, number],
    stroke_width: 5,
    opacity: 1,
};

export function get_value_or_else<D>(
    data: Record<string, string>,
    key: string,
    or_else: D,
): D {
    const entry = data[`_style_${key}`];

    if (!entry) return or_else;
    return JSON.parse(entry);
}

export function get_stroke(l: Line): LineRenderAttributes["stroke"];
export function get_stroke(p: Point): PointRenderAttributes["stroke"];
export function get_stroke(
    e: SketchElement,
): LineRenderAttributes["stroke"] | PointRenderAttributes["stroke"];
export function get_stroke(
    e: SketchElement,
): LineRenderAttributes["stroke"] | PointRenderAttributes["stroke"] {
    return get_value_or_else(
        e.data,
        "stroke",
        e instanceof Point
            ? defaultPointRenderAttributes.stroke
            : defaultLineRenderAttributes.stroke,
    );
}

export function get_opacity<E extends SketchElement>(e: E): number {
    return get_value_or_else(
        e.data,
        "opactity",
        e instanceof Point
            ? defaultPointRenderAttributes.opacity
            : defaultLineRenderAttributes.opacity,
    );
}

export function get_stroke_width<E extends SketchElement>(e: E): number {
    return get_value_or_else(
        e.data,
        "stroke_width",
        e instanceof Point
            ? defaultPointRenderAttributes.stroke_width
            : defaultLineRenderAttributes.stroke_width,
    );
}

export function get_fill(e: Point): Color.Color {
    return get_value_or_else(e.data, "fill", defaultPointRenderAttributes.fill);
}

export function get_radius(e: Point): number {
    return get_value_or_else(
        e.data,
        "radius",
        defaultPointRenderAttributes.radius,
    );
}

export function get_styles(l: Line): LineRenderAttributes;
export function get_styles(p: Point): PointRenderAttributes;
export function get_styles(
    e: SketchElement,
): LineRenderAttributes | PointRenderAttributes;
export function get_styles(
    e: SketchElement,
): LineRenderAttributes | PointRenderAttributes {
    if (e instanceof Point) {
        return {
            radius: get_radius(e),
            fill: get_fill(e),
            stroke: get_stroke(e),
            stroke_width: get_stroke_width(e),
            opacity: get_opacity(e),
        };
    }

    return {
        stroke: get_stroke(e),
        stroke_width: get_stroke_width(e),
        opacity: get_opacity(e),
    } as const;
}
