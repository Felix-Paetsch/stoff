// All sizes here are given as Pixels and will be converted to image space

import { Color, Gradient } from "@/Core";

export const point_attributes = {
    stroke: "black" as Color,
    stroke_width: 3,
    fill: "white" as Color,
    opacity: 1,
    radius: 10,
};

export const line_attributes = {
    rh_stroke: [["#ccc", "rgb(0,0,100)"], 3] as [Gradient, number],
    lh_stroke: [["#ccc", "rgb(100,0,0)"], 3] as [Gradient, number],
    stroke_width: 5,
    opacity: 1,
};
