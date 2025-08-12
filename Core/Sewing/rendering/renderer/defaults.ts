import { FaceRenderAttributes, LineRenderAttributes, PointRenderAttributes } from "./index";

export const default_point_attributes: PointRenderAttributes = {
    stroke: "black",
    strokeWidth: 1,
    fill: "white",
    opacity: 1,
    radius: 1,
};

export const default_line_attributes: LineRenderAttributes = {
    stroke: "black",
    strokeWidth: 1,
    opacity: 1,
};

export const default_face_attributes: FaceRenderAttributes = {
    fill: "blue",
    opacity: 1,
    width: 5,
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
    stroke: "black",
    strokeWidth: 2,
    opacity: 1,
}

export const default_sewing_line_other_attributes: LineRenderAttributes = {
    stroke: "black",
    strokeWidth: 2,
    opacity: 1,
}