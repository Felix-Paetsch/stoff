import { Sewing } from "@/Core/Sewing/sewing";
import { FaceRenderAttributes, LineRenderAttributes } from "../renderer";
import { Renderer } from "../renderer";
import { SewingLine } from "@/Core/Sewing/sewingLine";

const iron_line_attributes_primary: Partial<LineRenderAttributes> = {
    stroke: ["#ccf", "blue"]
}

const iron_line_attributes_other: Partial<LineRenderAttributes> = {
    stroke: ["#cfc", "green"],
    opacity: 0.5
}

const iron_face_attributes: Partial<FaceRenderAttributes> = {
    fill: "green"
}

export function ironRenderer(sewing: Sewing, line: SewingLine): Renderer {
    const renderer = new Renderer(sewing, "iron");
    renderer.render_sewing_line(line, iron_line_attributes_primary, iron_line_attributes_other);
    renderer.render_face_carousel(line.face_carousel, iron_face_attributes);
    return renderer;
}
