import { LineRenderAttributes } from "@/Core/StoffLib/line";
import { PointRenderAttributes } from "@/Core/StoffLib/point";
import { FaceEdgeRenderAttributes } from "../renderer";
import { Color, Gradient, interpolate_colors } from "@/Core/utils/colors";

export const sewing_inactive_point_style = {
    strokeWidth: 2,
    opacity: 1,
    radius: 3,
    fill: "white",
    stroke: "black",
} as const;

export const sewing_inactive_line_style = {
    stroke: ["#ccc", "black"],
    strokeWidth: 3,
    opacity: 1,
} as const;

export const sewing_active_point_style = {
    radius: 6,
    strokeWidth: 0,
    opacity: 1,
    stroke: "black"
} as const;

export const sewing_active_line_style = {
    strokeWidth: 3,
    opacity: 1,
} as const;

export const sewing_face_style = {
    width: 3,
    opacity: 0.4,
    style: "fill",
    strokeWidth: 3
} as const;

const non_sewing_opacity = 0.5;
const non_sewing_stroke = "#ccc";

export const default_non_sewing_point_attributes: PointRenderAttributes = {
    ...sewing_inactive_point_style,
    opacity: non_sewing_opacity,
    stroke: non_sewing_stroke
}

export const default_non_sewing_line_attributes: LineRenderAttributes = {
    ...sewing_inactive_line_style,
    opacity: non_sewing_opacity,
    stroke: non_sewing_stroke
}

export const default_inactive_sewing_point_attributes: PointRenderAttributes = {
    ...sewing_inactive_point_style,
    stroke: "black",
    fill: "white",
}

export const default_inactive_sewing_line_primary_attributes: LineRenderAttributes = {
    ...sewing_inactive_point_style
}

export const default_inactive_sewing_line_other_attributes: LineRenderAttributes = {
    ...sewing_inactive_point_style
}

// Sewing active defaults

export const default_active_sewing_point_attributes: PointRenderAttributes = {
    ...sewing_active_point_style,
    fill: "blue"
}

export const default_active_sewing_line_primary_attributes: LineRenderAttributes = {
    ...sewing_active_line_style,
    stroke: to_gradient("blue")
}

export const default_active_sewing_line_other_attributes: LineRenderAttributes = {
    ...sewing_active_line_style,
    stroke: to_gradient("green")
}


export const default_active_sewing_line_start_point: PointRenderAttributes = {
    ...sewing_active_point_style,
    fill: to_gradient("blue")[0]
}

export const default_active_sewing_line_end_point: PointRenderAttributes = {
    ...sewing_active_point_style,
    fill: to_gradient("blue")[1]
}

export const default_active_sewing_line_middle_point: PointRenderAttributes = {
    ...sewing_active_point_style,
    fill: "#ccc"
}

export const default_active_sewing_line_up_face: FaceEdgeRenderAttributes = {
    ...sewing_face_style,
    fill: "green"
}

export const default_active_sewing_line_down_face: FaceEdgeRenderAttributes = {
    ...sewing_face_style,
    fill: "red"
}

// Utils

export function to_gradient(c: Color): Gradient {
    return [
        interpolate_colors("white", c, 0.2),
        c
    ]
}
