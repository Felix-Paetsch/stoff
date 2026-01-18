import { LineRenderAttributes } from "@/Core/StoffLib/line";
import { PointRenderAttributes } from "@/Core/StoffLib/point";
import { FaceEdgeRenderAttributes, FaceRenderAttributes } from "../renderer";

export const default_point_attributes: PointRenderAttributes = {
    stroke: "black",
    strokeWidth: 2,
    fill: "white",
    opacity: 1,
    radius: 3,
};

export const default_line_attributes: LineRenderAttributes = {
    stroke: ["#ccc", "black"],
    strokeWidth: 3,
    opacity: 1,
};

export const default_face_render_attributes: FaceRenderAttributes = {
    fill: "#ccc",
    opacity: 0.2,
    style: "fill"
}

export const default_face_edge_attributes: FaceEdgeRenderAttributes = {
    width: 3,
    fill: "#ccc",
    opacity: 0.2,
    style: "fill"
}


