import { Sewing } from "@/Core/Sewing/sewing";
import { SewingLine } from "@/Core/Sewing/sewingLine";
import { Renderer } from "../renderer";
import { render_active_sewing_line, render_inactive_sewing } from "../render_sewing_methods";

export function sewRenderer(sewing: Sewing, line: SewingLine): Renderer {
    const renderer = new Renderer(sewing, "sew");

    render_inactive_sewing(renderer);
    render_active_sewing_line(
        renderer,
        line
    );

    return renderer;
}
