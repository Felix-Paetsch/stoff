import { Sewing } from "../../sewing";
import { SewingLine } from "../../sewingLine";
import Renderer, { FaceRenderAttributes, LineRenderAttributes } from "../renderer";

const sew_line_attributes_primary: Partial<LineRenderAttributes> = {
    stroke: "red"
}

const sew_line_attributes_other: Partial<LineRenderAttributes> = {
    stroke: "purple"
}

const sew_face_attributes: Partial<FaceRenderAttributes> = {
    fill: "green"
}

export default function sewRenderer(sewing: Sewing, line: SewingLine): Renderer {
    const renderer = new Renderer(sewing, "sew");
    renderer.render_face_carousel(line.face_carousel, sew_face_attributes);
    renderer.render_sewing_line(line, sew_line_attributes_primary, sew_line_attributes_other);
    return renderer;
}