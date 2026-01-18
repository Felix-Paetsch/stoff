import { Sewing } from "@/Core/Sewing/sewing";
import * as CollectionMethods from "@/Core/StoffLib/collection";
import { Line, LineRenderAttributes } from "@/Core/StoffLib/line";
import { Point, PointRenderAttributes } from "@/Core/StoffLib/point";
import { Renderer } from "../renderer";
import { get_line_render_data, get_point_render_data, render_sketches } from "../render_sketches_methods";
import { default_active_sewing_line_primary_attributes, default_active_sewing_point_attributes, default_non_sewing_line_attributes, default_non_sewing_point_attributes, to_gradient } from "../defaults/sewing";
import { render_inactive_sewing, render_sewing } from "../render_sewing_methods";

const cut_line_attributes: LineRenderAttributes = {
    ...default_active_sewing_line_primary_attributes,
    stroke: to_gradient("red")
}

const cut_point_attributes: Partial<PointRenderAttributes> = {
    ...default_active_sewing_point_attributes,
    fill: "red"
}

function render_cut_line(r: Renderer, line: Line) {
    r.render_line(
        line,
        cut_line_attributes,
        ["base"],
        [],
        get_line_render_data(line)
    );

    r.render_point(
        line.p1,
        cut_point_attributes,
        ["base"],
        [],
        get_point_render_data(line.p1)
    );

    r.render_point(
        line.p2,
        cut_point_attributes,
        ["base"],
        [],
        get_point_render_data(line.p2)
    );
}

export function cutRenderer(sewing: Sewing, lines: Line[]): Renderer & {
    add_cut_line: (line: Line) => void
} {
    const renderer = new Renderer(sewing, "cut");
    render_inactive_sewing(renderer);

    lines.forEach(line => {
        render_cut_line(renderer, line);
    });

    return Object.assign(renderer, {
        add_cut_line: (line: Line) => {
            render_cut_line(renderer, line);
        }
    });
}
