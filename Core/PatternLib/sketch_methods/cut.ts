import Sketch from "@/Core/StoffLib/sketch";
import assert from "../../assert";
import { LineGroup } from "./calculate_cut_groups";
import Line from "../../StoffLib/line";
import Point from "../../StoffLib/point";
import { same_sketch } from "@/Core/StoffLib/assert_methods/exports";

export type CutPart = {
    lines: Line[],
    points: Point[],
    adjacent: Line[]
}

export function cut_with_fixed_point(
    s: Sketch,
    lines: Line[],
    fixed_pt: Point,
    grp1: LineGroup,
    grp2: LineGroup
): [CutPart, CutPart] {
    const ordered = Line.order_by_endpoints(...lines);

    assert(ordered.points[0] == fixed_pt || ordered.points[ordered.points.length - 1] == fixed_pt);
    assert(same_sketch(s, ...lines));

    const copied_points = ordered.points.map(p => {
        if (p == fixed_pt) {
            return p;
        }
        return p.copy(s);
    });

    const copied_lines: Line[] = [];
    for (let i = 0; i < ordered.length; i++) {
        if (ordered.orientations[i]) {
            copied_lines.push(
                s.copy_line(ordered[i], ordered.points[i], ordered.points[i + 1])
            )
        } else {
            copied_lines.push(
                s.copy_line(ordered[i], ordered.points[i + 1], ordered.points[i])
            )
        }
    }

    grp2.forEach(line => {
        const endpoint_index = ordered.points.findIndex(p => line.has_endpoint(p));
        line.replace_endpoint(ordered.points[endpoint_index], copied_points[endpoint_index]);
    });

    return [
        {
            lines: lines,
            points: ordered.points,
            adjacent: grp1
        }, {
            lines: lines,
            points: copied_points,
            adjacent: grp2
        }
    ]
}

export function cut_without_fixed_point(
    s: Sketch,
    lines: Line[],
    grp1: LineGroup,
    grp2: LineGroup
): [CutPart, CutPart] {
    const ordered = Line.order_by_endpoints(...lines);
    assert(same_sketch(s, ...lines));

    const copied_points = ordered.points.map(p => p.copy(s));
    const copied_lines: Line[] = [];
    for (let i = 0; i < ordered.length; i++) {
        if (ordered.orientations[i]) {
            copied_lines.push(
                s.copy_line(ordered[i], ordered.points[i], ordered.points[i + 1])
            )
        } else {
            copied_lines.push(
                s.copy_line(ordered[i], ordered.points[i + 1], ordered.points[i])
            )
        }
    }

    grp2.forEach(line => {
        const endpoint_index = ordered.points.findIndex(p => line.has_endpoint(p));
        line.replace_endpoint(ordered.points[endpoint_index], copied_points[endpoint_index]);
    });

    return [
        {
            lines: lines,
            points: ordered.points,
            adjacent: grp1
        }, {
            lines: lines,
            points: copied_points,
            adjacent: grp2
        }
    ]
}
