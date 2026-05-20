import * as Color from "../../colors";
export type LineRenderAttributes = {
    stroke: [Color.Gradient, number] | Color.Gradient | Color.Color;
    stroke_width: number;
    opacity: number;
};

export type PointRenderAttributes = {
    stroke: Color.Color;
    stroke_width: number;
    fill: Color.Color;
    opacity: number;
    radius: number;
};
