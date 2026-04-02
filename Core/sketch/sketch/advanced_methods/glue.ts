import { expect } from "../../../expect";
import { Sketch } from "..";
import { remove_underscore_attributes } from "./exports";
import { Line } from "../../line";
import { Point } from "../../point";
import { CopySketchObjectDataCallback } from "../../collection/copy";
import {
    AvoidantConnectedComponent,
    ConnectedComponent,
} from "../../collection/connected_component";
import { affine_transform_from_input_output } from "../../../geometry";
import { lines_by_key } from "../../collection";

export type GlueIdent = Line | [Point, Point] | [Line, Point];
export type GlueResult =
    | {
          glue_type: "with_fixed";
          fixed_point: Point;
          points: [Point, Point] | null;
          glue_line: Line | null;
      }
    | {
          glue_type: "without_fixed";
          points: [Point, Point] | null;
          glue_line: Line | null;
      };

function glue_ident_to_unvalidated_global_form(
    ident: GlueIdent,
): [Point, Point] {
    if (ident instanceof Line) {
        ident.data.__glue_line = "true";
        return [ident.p1, ident.p2];
    }
    const [el1, el2] = ident;
    if (el1 instanceof Point) return [el1, el2];

    el1.data.__glue_line = "true";
    return [el2, el1.other_endpoint(el2)];
}

function glue_ident_to_global_form(ident: GlueIdent): [Point, Point] {
    const res = glue_ident_to_unvalidated_global_form(ident);
    expect(!res[0].equals(res[1]));
    return res;
}

export function glue(
    s: Sketch,
    ident1: GlueIdent,
    ident2: GlueIdent,
    data: {
        points: "delete" | CopySketchObjectDataCallback;
        lines: "delete" | "keep" | CopySketchObjectDataCallback;
    },
): GlueResult {
    const gd1 = glue_ident_to_global_form(ident1);
    const gd2 = glue_ident_to_global_form(ident2);

    if (gd1[0] === gd2[0]) {
        return glue_with_fixed_point(s, gd1, gd2, data);
    }
    if (gd1[0] === gd2[1]) {
        return glue_with_fixed_point(s, gd1, [gd2[1], gd2[0]], data);
    }
    if (gd1[1] === gd2[0]) {
        return glue_with_fixed_point(s, [gd1[1], gd1[0]], gd2, data);
    }
    if (gd1[1] === gd2[1]) {
        return glue_with_fixed_point(
            s,
            [gd1[1], gd1[0]],
            [gd2[1], gd2[0]],
            data,
        );
    }

    return glue_without_fixed_point(s, gd1, gd2, data);
}

// The first entry agree
function glue_with_fixed_point(
    s: Sketch,
    ident1: [Point, Point],
    ident2: [Point, Point],
    data: {
        points: "delete" | CopySketchObjectDataCallback;
        lines: "delete" | "keep" | CopySketchObjectDataCallback;
    },
): GlueResult & {
    glue_type: "with_fixed";
} {
    expect(ident1[1] !== ident2[1], "Already glued together");

    const fixed = ident1[0];
    const p1 = ident1[1];
    const p2 = ident2[1];

    const total_connected_component_points = new ConnectedComponent(
        fixed,
    ).get_points();
    expect(
        total_connected_component_points.includes(p1) &&
            total_connected_component_points.includes(p2),
        "Can't glue non-connected glueing ident",
    );

    const avoidant_cc2_points = new AvoidantConnectedComponent(p2, [
        fixed,
    ]).get_points();
    expect(
        !avoidant_cc2_points.includes(p1),
        "Can't glue components, because they are coupled at more than one joint",
    );

    const transform_fun = affine_transform_from_input_output(
        [fixed, p2],
        [fixed, p1],
    );
    avoidant_cc2_points.forEach((pt) => pt.move_to(transform_fun(pt)));

    let merged_pt: Point;
    if (data.points !== "delete") {
        merged_pt = s.merge_points(p1, p2, data.points);
    } else {
        merged_pt = s.merge_points(p1, p2);
    }

    let glue_lines =
        lines_by_key(s, "__glue_line")["true"] || merged_pt.common_lines(fixed);
    remove_underscore_attributes(s, "__glue_line");

    if (data.lines == "keep") {
        return {
            glue_type: "with_fixed",
            glue_line: null,
            fixed_point: fixed,
            points: [fixed, merged_pt],
        };
    }

    if (data.lines == "delete" || data.points == "delete") {
        s.remove(...glue_lines);
        glue_lines = [];
    } else {
        expect(
            glue_lines.length == 1 || glue_lines.length == 2,
            "Can't glue lines (wront amount)",
        );

        if (glue_lines.length == 2) {
            const res = data.lines(
                glue_lines[0]!.data,
                glue_lines[1]!.data,
                glue_lines[0]!,
                glue_lines[1]!,
            ); // data.lines is data_callback
            if (res) {
                glue_lines[0]!.data = res;
            }
            s.remove(glue_lines[1]!);
            glue_lines.pop();
        }
    }

    if (data.points == "delete") {
        delete_glue_point(
            s,
            merged_pt,
            data.lines as CopySketchObjectDataCallback,
        );
    }

    return {
        glue_type: "with_fixed",
        glue_line: glue_lines[0] || null,
        fixed_point: fixed,
        points: data.points == "delete" ? null : [fixed, merged_pt],
    };
}

function glue_without_fixed_point(
    s: Sketch,
    ident1: [Point, Point],
    ident2: [Point, Point],
    data: {
        points: "delete" | CopySketchObjectDataCallback;
        lines: "delete" | "keep" | CopySketchObjectDataCallback;
    },
): GlueResult & {
    glue_type: "without_fixed";
} {
    const cc2 = new ConnectedComponent(ident2[0]).get_points();
    expect(
        !cc2.includes(ident1[0]) && !cc2.includes(ident1[1]),
        "Can't glue components, because they are coupled",
    );
    expect(cc2.includes(ident2[1]), "Glue ident isn't connected");

    const transform_fun = affine_transform_from_input_output(ident2, ident1);
    cc2.forEach((pt) => pt.move_to(transform_fun(pt)));

    let merged_points: [Point, Point];
    if (data.points !== "delete") {
        merged_points = [
            s.merge_points(ident1[0], ident2[0], data.points),
            s.merge_points(ident1[1], ident2[1], data.points),
        ];
    } else {
        merged_points = [
            s.merge_points(ident1[0], ident2[0]),
            s.merge_points(ident1[1], ident2[1]),
        ];
    }

    const glue_lines =
        lines_by_key(s, "__glue_line")["true"] ||
        merged_points[0].common_lines(merged_points[1]);
    remove_underscore_attributes(s, "__glue_line");

    if (data.lines == "keep") {
        return {
            glue_type: "without_fixed",
            points: merged_points,
            glue_line: null,
        };
    }

    if (data.lines == "delete" || data.points == "delete") {
        s.remove(...glue_lines);
    } else {
        expect(
            glue_lines.length == 1 || glue_lines.length == 2,
            "Can't glue lines (wront amount)",
        );

        if (glue_lines.length == 2) {
            const res = data.lines(
                glue_lines[0]!.data,
                glue_lines[1]!.data,
                glue_lines[0]!,
                glue_lines[1]!,
            ); // data.lines is data_callback
            if (res) {
                glue_lines[0]!.data = res;
            }
            s.remove(glue_lines[1]!);
            glue_lines.pop();
        }
    }

    if (data.points == "delete") {
        delete_glue_point(
            s,
            merged_points[0],
            data.lines as CopySketchObjectDataCallback,
        );
        delete_glue_point(
            s,
            merged_points[1],
            data.lines as CopySketchObjectDataCallback,
        );
    }

    return {
        glue_type: "without_fixed",
        points: data.points == "delete" ? null : merged_points,
        glue_line: glue_lines[0] || null,
    };
}

function delete_glue_point(
    s: Sketch,
    pt: Point,
    line_callback: CopySketchObjectDataCallback,
) {
    const adjacent = pt.get_adjacent_lines();
    if (adjacent.length < 2) {
        s.remove(pt);
        return null;
    }
    if (adjacent.length > 2)
        throw new Error(
            "Cant safely delete glue point! Not two adjacent lines",
        );
    return s.merge_lines(adjacent[0]!, adjacent[1]!, true, line_callback);
}
