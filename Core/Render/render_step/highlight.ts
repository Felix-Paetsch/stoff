import { Sewing } from "@/Core/Sewing/sewing";
import { FaceRenderAttributes, LineRenderAttributes, PointRenderAttributes, Renderer } from "../renderer";
import { SewingLine } from "@/Core/Sewing/sewingLine";
import { SewingPoint } from "@/Core/Sewing/sewingPoint";

const highlight_line_attributes_primary: Partial<LineRenderAttributes> = {
    stroke: ["#ccf", "blue"]
}

const highlight_line_attributes_other: Partial<LineRenderAttributes> = {
    stroke: ["#cfc", "green"]
}

const highlight_point_attributes: Partial<PointRenderAttributes> = {
    stroke: "black",
    fill: "purple"
}


const highlight_face_attributes: Partial<FaceRenderAttributes> = {
    fill: "green"
}

export function highlightRenderer(sewing: Sewing, objects: (SewingLine | SewingPoint)[]): Renderer {
    let index = 0;
    const renderer = new Renderer(sewing, "highlight");
    renderer.render_sketches();
    objects.forEach(object => {
        if (object instanceof SewingLine) {
            renderer.render_sewing_line(object, {
                ...highlight_line_attributes_primary,
                extra_data: {
                    SewingLine: ++index
                }
            }, {
                ...highlight_line_attributes_other,
                extra_data: {
                    SewingLine: index
                }
            });
            renderer.render_face_carousel(object.face_carousel, {
                ...highlight_face_attributes,
                extra_data: {
                    SewingLine: index
                }
            });
        } else {
            renderer.render_sewing_point(object, {
                ...highlight_point_attributes,
                extra_data: {
                    SewingPoint: ++index
                }
            });
        }
    });
    return renderer;
}
