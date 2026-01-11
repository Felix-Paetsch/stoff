import { Sewing } from "@/Core/Sewing/sewing";
import { FaceRenderAttributes, LineRenderAttributes } from "../renderer";
import { Renderer } from "../renderer";
import { SewingLine } from "@/Core/Sewing/sewingLine";

const fold_line_attributes: Partial<LineRenderAttributes> = {
    stroke: ["#ccf", "blue"]
}

const fold_face_attributes: Partial<FaceRenderAttributes> = {
    fill: "green"
}

export function foldRenderer(sewing: Sewing, line: SewingLine): Renderer {
    const renderer = new Renderer(sewing, "fold");
    renderer.render_sketches();
    renderer.render_sewing_line(line, fold_line_attributes, fold_line_attributes);
    renderer.render_face_carousel(line.face_carousel, fold_face_attributes);
    return renderer;
}
