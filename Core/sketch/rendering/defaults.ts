import {
    LineRenderAttributes,
    PointRenderAttributes,
} from "@/Core/files/svg/render_attributes";

export const default_point_attributes: PointRenderAttributes = {
    stroke: "black",
    stroke_width: 2,
    fill: "white",
    opacity: 1,
    radius: 3,
    render_priority: 100,
};

export const default_line_attributes: LineRenderAttributes = {
    stroke: ["#ccc", "black"],
    stroke_width: 3,
    opacity: 1,
    render_priority: 10,
};

export const default_face_render_attributes: LineRenderAttributes = {
    stroke: "#ccc",
    stroke_width: 2,
    opacity: 0.2,
    render_priority: 5,
};
