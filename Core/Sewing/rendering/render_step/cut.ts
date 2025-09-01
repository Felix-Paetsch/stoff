import Renderer, { PointRenderAttributes } from "../renderer";
import { Sewing } from "../../sewing";
import Line from "../../../StoffLib/line";
import Point from "../../../StoffLib/point";
import { LineRenderAttributes } from "../renderer";
import SketchElementCollection from "@/Core/StoffLib/sketch_element_collection";

const cut_line_attributes: Partial<LineRenderAttributes> = {
    stroke: ["#fcc", "red"]
}

const cut_point_attributes: Partial<PointRenderAttributes> = {
    stroke: "red",
    fill: "red"
}

export default function cutRenderer(sewing: Sewing, lines: Line[]): Renderer & {
    add_cut_line: (line: Line) => void
} {
    const renderer = new Renderer(sewing, "cut");
    renderer.render_sketches();
    lines.forEach(line => {
        renderer.render_line(line, cut_line_attributes);
    });
    const se = new SketchElementCollection(lines);
    (se as any).endpoint_hull().get_points().forEach((p: Point) => {
        renderer.render_point(p, cut_point_attributes);
    });
    return Object.assign(renderer, {
        add_cut_line: (line: Line) => {
            renderer.render_line(line, cut_line_attributes);
        }
    });
}