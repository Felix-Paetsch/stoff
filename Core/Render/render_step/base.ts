import { Sewing } from "@/Core/Sewing/sewing";
import { Renderer } from "../renderer";

export function baseRenderer(sewing: Sewing): Renderer {
    const renderer = new Renderer(sewing, "pattern");
    renderer.render_sketches();
    return renderer;
}
