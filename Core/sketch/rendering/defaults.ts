// All sizes here are given as Pixels and will be converted to image space

import { Color, Gradient } from "@/Core/colors";

export const point_attributes = {
    stroke: "black" as Color,
    stroke_width: 3,
    fill: "white" as Color,
    opacity: 1,
    radius: 10,
};

export const line_attributes = {
    stroke: ["#ccc", "black"] as Gradient,
    stroke_width: 5,
    opacity: 1,
};
