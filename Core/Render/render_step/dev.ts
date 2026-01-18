import { Sewing } from "@/Core/Sewing/sewing";
import { Renderer } from "../renderer";
import { render_sewing } from "../render_sewing_methods";

export function devRenderer(sewing: Sewing): Renderer {
    const renderer = new Renderer(sewing, "dev");
    render_sewing(renderer);
    return renderer;
}
