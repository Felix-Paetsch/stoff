import Renderer from "../renderer";
import { Sewing } from "../../sewing";
import { Line } from "../../../StoffLib/line";
import { LineRenderAttributes } from "../renderer";

const cut_line_attributes: Partial<LineRenderAttributes> = {
    stroke: "red"
}

export default function cutRenderer(sewing: Sewing, lines: Line[]): Renderer & {
    add_cut_line: (line: Line) => void
} {
    const renderer = new Renderer(sewing, "cut");
    lines.forEach(line => {
        renderer.render_line(line, cut_line_attributes);
    })
    return Object.assign(renderer, {
        add_cut_line: (line: Line) => {
            renderer.render_line(line, cut_line_attributes);
        }
    });
}