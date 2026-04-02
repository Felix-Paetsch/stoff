import { Color, Gradient } from "@/Core/colors";
import { SVGGradient } from "./svg_builder";

export type TextRenderAttributes = {
    font_family: string;
    font_size: number;
    fill: Color;
    font_weight:
        | "normal"
        | "bold"
        | "lighter"
        | "bolder"
        | 100
        | 200
        | 300
        | 400
        | 500
        | 600
        | 700
        | 800
        | 900;
    text_anchor: "start" | "middle" | "end";
    render_priority: number;
};

export const defaultTextRenderAttributes: TextRenderAttributes = {
    font_family: "Arial",
    font_size: 12,
    fill: "black",
    font_weight: "normal",
    text_anchor: "start",
    render_priority: 100,
};

export type PointRenderAttributes = {
    radius: number;
    fill: Color | null;
    stroke: Color | null;
    stroke_width: number;
    opacity: number;
    render_priority: number;
};

export const defaultPointRenderAttributes: PointRenderAttributes = {
    radius: 5,
    fill: "white",
    stroke: "black",
    stroke_width: 2,
    opacity: 1,
    render_priority: 80,
};

export type LineRenderAttributes = {
    stroke: Color | Gradient | SVGGradient | null;
    stroke_width: number;
    opacity: number;
    render_priority: number;
};

export const defaultLineRenderAttributes: LineRenderAttributes = {
    stroke: "black",
    stroke_width: 2,
    opacity: 1,
    render_priority: 30,
};

export type PolygonRenderAttributes = {
    fill: Color | Gradient | SVGGradient | null;
    stroke: Color | Gradient | SVGGradient | null;
    stroke_width: number;
    opacity: number;
    render_priority: number;
};

export const defaultPolygonRenderAttributes: PolygonRenderAttributes = {
    fill: null,
    stroke: "black",
    stroke_width: 2,
    opacity: 1,
    render_priority: 20,
};
