import { Copy, Expect, Line, Point, Sketch } from "@/Core";
import { Validate } from "@/Dev";
import { order_by_endpoints } from "Algorithms/order_lines";
import { LineGroup } from "./calculate_cut_groups";

export type CutPart = {
    lines: Line[];
    points: Point[];
    adjacent: Line[];
};

export function cut_with_fixed_point(
    s: Sketch,
    lines: Line[],
    fixed_pt: Point,
    grp1: LineGroup,
    grp2: LineGroup,
): [CutPart, CutPart] {
    const ordered = Expect.truthy(order_by_endpoints(...lines));

    Expect.that(
        [ordered.points[0], ordered.points[ordered.points.length - 1]].includes(
            fixed_pt,
        ),
    );
    Expect.that(Validate.same_sketch(s, ...lines));

    const copied_points = ordered.points.map((p) => {
        if (p == fixed_pt) {
            return p;
        }
        return Copy.point(p);
    });

    const copied_lines: Line[] = [];
    for (let i = 0; i < ordered.lines.length; i++) {
        if (ordered.orientations[i]) {
            copied_lines.push(
                Copy.line(
                    ordered.lines[i]!,
                    ordered.points[i]!,
                    ordered.points[i + 1]!,
                ),
            );
        } else {
            copied_lines.push(
                Copy.line(
                    ordered.lines[i]!,
                    ordered.points[i + 1]!,
                    ordered.points[i]!,
                ),
            );
        }
    }

    grp2.forEach((line) => {
        const endpoint_index = ordered.points.findIndex((p) =>
            line.has_endpoint(p),
        );
        line.replace_endpoint(
            ordered.points[endpoint_index]!,
            copied_points[endpoint_index]!,
        );
    });

    return [
        {
            lines: lines,
            points: ordered.points,
            adjacent: grp1,
        },
        {
            lines: lines,
            points: copied_points,
            adjacent: grp2,
        },
    ];
}

export function cut_without_fixed_point(
    s: Sketch,
    lines: Line[],
    grp1: LineGroup,
    grp2: LineGroup,
): [CutPart, CutPart] {
    const ordered = Expect.truthy(order_by_endpoints(...lines));
    Expect.that(Validate.same_sketch(s, ...lines));

    const copied_points = ordered.points.map((p) => Copy.point(p));
    const copied_lines: Line[] = [];
    for (let i = 0; i < ordered.lines.length; i++) {
        if (ordered.orientations[i]) {
            copied_lines.push(
                Copy.line(
                    ordered.lines[i]!,
                    ordered.points[i]!,
                    ordered.points[i + 1]!,
                ),
            );
        } else {
            copied_lines.push(
                Copy.line(
                    ordered.lines[i]!,
                    ordered.points[i + 1]!,
                    ordered.points[i]!,
                ),
            );
        }
    }

    grp2.forEach((line) => {
        const endpoint_index = ordered.points.findIndex((p) =>
            line.has_endpoint(p),
        );
        line.replace_endpoint(
            ordered.points[endpoint_index]!,
            copied_points[endpoint_index]!,
        );
    });

    return [
        {
            lines: lines,
            points: ordered.points,
            adjacent: grp1,
        },
        {
            lines: lines,
            points: copied_points,
            adjacent: grp2,
        },
    ];
}
