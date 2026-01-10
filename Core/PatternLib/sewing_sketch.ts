import assert from "../assert";
import Sketch from "../StoffLib/sketch";
import Line from "../StoffLib/line";
import { Vector, VERTICAL } from "../StoffLib/geometry";

import { glue, GlueIdent, GlueResult } from "./sketch_methods/glue";

import Point from "../StoffLib/point";
import { CopySketchDataCallback, default_data_callback } from "../StoffLib/copy";
import { cut_with_fixed_point, cut_without_fixed_point, type CutPart } from "./sketch_methods/cut.ts";
import { calculate_cut_groups_no_fixed_point, calculate_cut_groups_with_fixed_point, LineGroup } from "./sketch_methods/calculate_cut_groups";
import { SketchElement } from "../StoffLib/types.ts";
import { same_sketch } from "../StoffLib/assert_methods/exports.ts";
import { lines_by_key, mirror } from "../StoffLib/collection.ts";

/*

    The sewing sketch implements methods that are usefull in the more specific context of sewing patterns.
    Some methods from pattern_component are not put here, as they depend more on the specific implementation choice we did.
    This mainly includes dealin with lines (and points) by their data.type

*/


export type UnfoldCallback = <T extends SketchElement>(el: T, type: "mirror" | "original", original: T) => void;

export default class SewingSketch extends Sketch {
    // Cuts at a line or line-path.
    // Visually CD => CI + D with the I and first part of D overlapping
    // If fixed point is set, they wont be seperated there
    cut(line: Line): [CutPart, CutPart];
    cut(line: Line, group1: LineGroup): [CutPart, CutPart];
    cut(line: Line, group1: LineGroup, group2: LineGroup): [CutPart, CutPart];

    cut(line: Line[]): [CutPart, CutPart];
    cut(line: Line[], group1: LineGroup): [CutPart, CutPart];
    cut(line: Line[], group1: LineGroup, group2: LineGroup): [CutPart, CutPart];

    cut(line: Line, fix_pt: Point): [CutPart, CutPart];
    cut(line: Line, fix_pt: Point, group1: LineGroup): [CutPart, CutPart];
    cut(line: Line, fix_pt: Point, group1: LineGroup, group2: LineGroup): [CutPart, CutPart];

    cut(line: Line[], fix_pt: Point): [CutPart, CutPart];
    cut(line: Line[], fix_pt: Point, group1: LineGroup): [CutPart, CutPart];
    cut(line: Line[], fix_pt: Point, group1: LineGroup, group2: LineGroup): [CutPart, CutPart];

    cut(
        line: Line | Line[],
        fixed_pt?: Point | "smart" | LineGroup | null,
        grp1?: LineGroup | "smart",
        grp2?: LineGroup
    ): [CutPart, CutPart] {
        /*
            Cuts a Sketch at a given line (i.e. copying it and some of its endpoints and attatch the other lines correctly)
            The following signatures are supported:

            (1) - line, true | fixed_pt, grp1, grp2
            (2) - line, true | fixed_pt, grp1
            (3) - line, true | fixed_pt, "smart"
            (4) - line, true | fixed_pt

            (5) - line, grp1, grp2
            (6) - line, grp1
            (7) - line, true | fixed_pt
            (8) - line

            (9)  - line[], grp1, grp2
            (10) - line[], grp1
            (11) - line[], "smart"
            (12) - line[], "force"
            (13) - line[]

            Line here may be replaced with 2 points which have a line between them or will form a straight line.
            Grp can also be given as a single line

            There are various reasons this can fail. To be documented. I.g. this fails if the input doesn't make sense in the current context.
            You should log the sketch and the stuff you put in right before.
        */

        if (line instanceof Line) {
            return (this as any).cut([line], fixed_pt, grp1, grp2);
        }

        if (fixed_pt instanceof Point) {
            let grp1_arg: LineGroup | null = null;
            if (grp1 instanceof Array) {
                grp1_arg = grp1;
            }

            const cut_groups = calculate_cut_groups_with_fixed_point(
                line,
                fixed_pt,
                grp1_arg
            );

            if (grp2) {
                assert(
                    cut_groups[1].every(grp2.includes)
                    && grp2.every(cut_groups[1].includes),
                    "Cut group specification is off"
                );
            }

            return cut_with_fixed_point(
                this,
                line,
                fixed_pt,
                cut_groups[0],
                cut_groups[1]
            )
        }

        let grp1_arg: LineGroup | null = null;
        if (fixed_pt instanceof Array) {
            grp1_arg = fixed_pt;
        }

        const cut_groups = calculate_cut_groups_no_fixed_point(
            line,
            grp1_arg
        );

        if (grp1 && grp1 instanceof Array) {
            assert(
                cut_groups[1].every(grp1.includes)
                && grp1.every(cut_groups[1].includes),
                "Cut group specification is off"
            );
        }

        return cut_without_fixed_point(
            this,
            line,
            cut_groups[0],
            cut_groups[1]
        )
    }

    // Merge the points without deleting them afterwards
    glue(ident1: GlueIdent, ident2: GlueIdent, data?: {
        points?: "merge" | CopySketchDataCallback,
        lines?: "merge" | "delete" | "keep" | CopySketchDataCallback
    }): GlueResult;
    // Merge lines at glueing point (automatically removing lines between glueing points)
    glue(ident1: GlueIdent, ident2: GlueIdent, data: {
        points: "delete",
        lines?: CopySketchDataCallback
    }): GlueResult;
    glue(ident1: GlueIdent, ident2: GlueIdent, data: Partial<{
        points: "merge" | "delete" | CopySketchDataCallback,
        lines: "merge" | "delete" | "keep" | CopySketchDataCallback
    }> = {}) {
        /*
            IN:
                    ----x-----   or      x-----------|
                        |                  \
                        |                    \
                    ----x-----              ----
            Out:
                    ----------   or                |
                                                   |
                                                   |
                    ----------                     |

            (ident_1, ident_2, {
                points: > "merge"  <, "delete", "delete_both", callback
                lines:  > "delete" <, "keep", "merge", callback
            })

            Ident Data can be:

            line
                              ~> [pt1, pt2]  
            [point1, point2]
            [line1, pt1]      ~> [pt1, other_endpoint]

            if (two points agree they are automatically both pushed to position1);
        */

        let gpoints = data.points || "merge";
        let glines = data.lines || "delete";

        if (
            typeof gpoints === "string"
            && gpoints.startsWith("delete")
            && typeof glines == "string"
        ) {
            glines = default_data_callback;
        }

        if (gpoints == "merge") {
            gpoints = default_data_callback;
        }

        if (glines == "merge") {
            glines = default_data_callback;
        }

        return glue(
            this,
            ident1,
            ident2,
            {
                points: gpoints,
                lines: glines
            }
        )
    }

    anchor(...objects: SketchElement[]) {
        assert(same_sketch(this, ...objects));

        // Connect everything by anchor lines. Usefull to move things, around especially when glueing
        const pts: Point[] = [];

        for (let i = 0; i < objects.length; i++) {
            const o = objects[i];
            if (o instanceof Point) {
                pts.push(o);
            } else if (o instanceof Line) {
                pts.push(o.p1);
            }
        }

        let connected_component_points = this.get_connected_components().map((c) =>
            c.get_points(),
        );

        if (objects.length > 0) {
            connected_component_points = connected_component_points.filter((c) => {
                return c.some((p) => pts.includes(p));
            });
        }

        for (let i = 1; i < connected_component_points.length; i++) {
            const a = this.line_between_points(
                connected_component_points[0][0],
                connected_component_points[i][0],
            );

            a.data = {
                __anchor: "true",
            };

            a.set_color("rgb(200,200,200)");
        }

        return this;
    }

    remove_anchors() {
        this.remove(...lines_by_key(this, "_anchor")["true"]);
        return this;
    }

    path_between_points(
        p1: Point,
        p2: Point,
        line: Line | null = null
    ) {
        if (line == null) {
            const adj = p1.get_adjacent_lines();
            assert(adj.length == 1);
            line = adj[0];
        }

        const points: Point[] = [p1];
        const lines: Line[] = [line];
        let last_line_p2 = lines[0].other_endpoint(p1);
        while (last_line_p2 !== p2) {
            points.push(last_line_p2);
            const new_line = last_line_p2.other_adjacent_line(
                lines[lines.length - 1],
            );
            lines.push(new_line);

            assert(new_line instanceof Line, "There is no path from p1 to p2.");
            assert(last_line_p2 != p1, "There is no path from p1 to p2.");
            last_line_p2 = new_line.other_endpoint(last_line_p2);
        }
        points.push(p2);

        return {
            lines,
            points,
        };
    }

    decompress_components() {
        const cc = this.get_connected_components().map((c) => c.obj());
        if (cc.length == 0) return this;

        const cols = Math.floor(Math.sqrt(cc.length) * 1.5);

        let current_TL = new Vector(0, 0);
        let current_index = 0;
        let max_height = 0;

        while (current_index < cc.length) {
            for (let i = 0; i < cols && current_index < cc.length; i++) {
                const c = cc[current_index];
                const off_by = current_TL.subtract(c.bounding_box.top_left);
                c.points.forEach((pt) => pt.offset_by(off_by));

                current_index++;
                current_TL.x += c.bounding_box.width + 3;
                max_height = Math.max(max_height, c.bounding_box.height);
            }

            current_TL.set(0, current_TL.y + max_height + 3);
            max_height = 0;
        }

        return this;
    }

    unfold(
        along_line: Line | [Point, Point],
        callback: UnfoldCallback = () => { }
    ) {
        if (along_line instanceof Line) {
            const tmp = along_line.get_endpoints();
            this.remove_line(along_line);
            along_line = tmp;
        }

        assert(same_sketch(...along_line, this));

        const old_pts = [...this.get_points()];
        const old_lines = [...this.get_lines()];

        old_lines.forEach((l) => (l.data.__unfoldUID = tUID()));
        old_pts.forEach((p) => (p.data.__unfoldUID = tUID()));

        mirror(this, VERTICAL);
        this.anchor();

        this.paste_sketch(this);
        mirror([...old_lines, ...old_pts], VERTICAL);

        const new_pts = [...this.get_points().filter(p => !old_pts.includes(p))]
        const new_lns = [...this.get_lines().filter(p => !old_lines.includes(p))]

        const get_dublicate_pt = (id: string) => new_pts.filter(p => p.data.__unfoldUID == id)[0]!;
        const get_dublicate_ln = (id: string) => new_lns.filter(l => l.data.__unfoldUID == id)[0]!;
        const get_orig_pt = (id: string) => old_pts.filter(p => p.data.__unfoldUID == id)[0]!;
        const get_orig_ln = (id: string) => old_lines.filter(l => l.data.__unfoldUID == id)[0]!;

        this.glue(
            along_line,
            [
                get_dublicate_pt(along_line[0].data.__unfoldUID),
                get_dublicate_pt(along_line[1].data.__unfoldUID),
            ],
            {
                points: (d) => d
            }
        )

        this.get_lines().forEach((l) => {
            const ref = get_orig_ln(l.data.__unfoldUID);
            if (ref === l) callback(l, "original", l);
            else callback(l, "mirror", ref);
        });

        this.get_points().forEach((p) => {
            const ref = get_orig_pt(p.data.__unfoldUID);
            if (ref === p) callback(p, "original", p);
            else callback(p, "mirror", ref);
        });
    }

    remove_underscore_attributes(...attr: string[]) {
        this.get_sketch_elements().forEach((p) => {
            for (const key of Object.keys(p.data)) {
                if (
                    key.startsWith("__") &&
                    (attr.length == 0 ||
                        attr.includes(key) ||
                        attr.includes(key.slice(2)))
                ) {
                    delete p.data[key];
                }
            }
        });

        return this;
    }

    delete_with_underscore_attributes(...attr: string[]) {
        this.get_sketch_elements().forEach((p) => {
            for (const key of Object.keys(p.data)) {
                if (
                    key.startsWith("__") &&
                    (attr.length == 0 ||
                        attr.includes(key) ||
                        attr.includes(key.slice(2)))
                ) {
                    this.remove(p);
                }
            }
        });

        return this;
    }
}


const _tUIDgen = tUID_gen();
const tUID = () => _tUIDgen.next().value!;
function* tUID_gen() {
    const MAX_SAFE_INT = Number.MAX_SAFE_INTEGER;
    let current: number = 0;

    while (true) {
        yield "tUID_" + current;
        current = current + 1 >= MAX_SAFE_INT - 1 ? 0 : current + 1;
    }
}
