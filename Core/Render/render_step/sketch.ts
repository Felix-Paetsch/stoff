import { Sewing } from "@/Core/Sewing/sewing";
import { Renderer } from "../renderer";
import { render_sketches } from "../render_sketches_methods";

export function baseRenderer(sewing: Sewing): Renderer {
    const renderer = new Renderer(sewing, "pattern");
    render_sketches(renderer);
    return renderer;
}
