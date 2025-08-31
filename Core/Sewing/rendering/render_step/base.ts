import Renderer from "../renderer";
import { Sewing } from "../../sewing";

export default function baseRenderer(sewing: Sewing): Renderer {
    const renderer = new Renderer(sewing, "pattern");
    renderer.render_sketches();
    return renderer;
}