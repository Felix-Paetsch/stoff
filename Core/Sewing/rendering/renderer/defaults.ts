import { FaceRenderAttributes, LineRenderAttributes, PointRenderAttributes } from "./index";

export const default_point_attributes: PointRenderAttributes = {
    stroke: "black",
    strokeWidth: 1,
    fill: "white",
    opacity: 1,
    radius: 2,
};

export const default_line_attributes: LineRenderAttributes = {
    stroke: ["#ccc", "black"],
    strokeWidth: 3,
    opacity: 1,
};

export const default_face_attributes: FaceRenderAttributes = {
    fill: "blue",
    opacity: 1,
    width: 6,
    style: "fill"
};

export const default_sewing_point_attributes: PointRenderAttributes = {
    stroke: "black",
    strokeWidth: 1,
    fill: "white",
    opacity: 1,
    radius: 2,
}

export const default_sewing_line_primary_attributes: LineRenderAttributes = {
    stroke: ["#f88", "red"],
    strokeWidth: 3,
    opacity: 1,
}

export const default_sewing_line_other_attributes: LineRenderAttributes = {
    stroke: ["#88f", "blue"],
    strokeWidth: 3,
    opacity: 1,
}