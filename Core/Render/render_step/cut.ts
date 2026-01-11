import { Sewing } from "@/Core/Sewing/sewing";
import { PointRenderAttributes, Renderer } from "../renderer";
import { LineRenderAttributes } from "../renderer";
import * as CollectionMethods from "@/Core/StoffLib/collection";
import { Line } from "@/Core/StoffLib/line";
import { Point } from "@/Core/StoffLib/point";

const cut_line_attributes: Partial<LineRenderAttributes> = {
    stroke: ["#fcc", "red"]
}

const cut_point_attributes: Partial<PointRenderAttributes> = {
    stroke: "red",
    fill: "red"
}

export function cutRenderer(sewing: Sewing, lines: Line[]): Renderer & {
    add_cut_line: (line: Line) => void
} {
    const renderer = new Renderer(sewing, "cut");
    renderer.render_sketches();
    lines.forEach(line => {
        renderer.render_line(line, cut_line_attributes);
    });
    CollectionMethods.get_points(
        CollectionMethods.endpoint_hull(lines)
    ).forEach((p: Point) => {
        renderer.render_point(p, cut_point_attributes);
    });
    return Object.assign(renderer, {
        add_cut_line: (line: Line) => {
            renderer.render_line(line, cut_line_attributes);
        }
    });
}
