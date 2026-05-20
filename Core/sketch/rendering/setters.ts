import * as Color from "../../colors";
import { Line } from "../line";
import { Point } from "../point";
import { SketchElement } from "../types";

import { LineRenderAttributes, PointRenderAttributes } from "./styles";

function get_data_key(
    s: keyof PointRenderAttributes | keyof LineRenderAttributes,
): string {
    return `_style_${s}`;
}

export function set_stroke(l: Line, s: LineRenderAttributes["stroke"]): Line;
export function set_stroke(p: Point, s: PointRenderAttributes["stroke"]): Point;
export function set_stroke(
    e: SketchElement,
    s: LineRenderAttributes["stroke"] & PointRenderAttributes["stroke"],
): SketchElement;
export function set_stroke(
    e: SketchElement,
    s: LineRenderAttributes["stroke"] | PointRenderAttributes["stroke"],
) {
    e.data[get_data_key("stroke")] = JSON.stringify(s);
    return e;
}

export function set_opacity<E extends SketchElement>(e: E, data: number) {
    e.data[get_data_key("opacity")] = JSON.stringify(data);
}

export function set_stroke_width<E extends SketchElement>(e: E, data: number) {
    e.data[get_data_key("stroke_width")] = JSON.stringify(data);
}

export function set_fill(e: Point, data: Color.Color) {
    e.data[get_data_key("fill")] = JSON.stringify(data);
}

export function set_radius(e: Point, data: number) {
    e.data[get_data_key("radius")] = JSON.stringify(data);
}

export function set_styles(l: Line, s: Partial<LineRenderAttributes>): Line;
export function set_styles(p: Point, s: Partial<PointRenderAttributes>): Point;
export function set_styles(
    e: SketchElement,
    s: Partial<LineRenderAttributes> & Partial<PointRenderAttributes>,
): SketchElement;
export function set_styles(
    e: SketchElement,
    s: Partial<LineRenderAttributes> | Partial<PointRenderAttributes>,
): SketchElement {
    Object.keys(s).forEach((k) => {
        e.data[get_data_key(k as any)] = JSON.stringify((s as any)[k]);
    });
    return e;
}
