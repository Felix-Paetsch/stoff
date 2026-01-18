import { Sewing } from "@/Core/Sewing/sewing";
import { SewingLine } from "@/Core/Sewing/sewingLine";
import { SewingPoint } from "@/Core/Sewing/sewingPoint";
import { Renderer } from "../renderer";
import { render_active_sewing_line, render_inactive_sewing, render_sewing_point } from "../render_sewing_methods";

export function highlightRenderer(sewing: Sewing, objects: (SewingLine | SewingPoint)[]): Renderer {
    const renderer = new Renderer(sewing, "highlight");

    render_inactive_sewing(renderer);

    objects.forEach(object => {
        if (object instanceof SewingLine) {
            render_active_sewing_line(
                renderer,
                object
            );
        } else {
            render_sewing_point(
                renderer,
                object
            )
        }
    });
    return renderer;
}
