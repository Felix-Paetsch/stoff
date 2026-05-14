import {
    CollectionMethods,
    Copy,
    Expect,
    Line,
    PlaneLine,
    Point,
    Sketch,
    SketchElement,
    Vector,
} from "@/Core";
import { Validate } from "@/Dev";
import {
    calculate_cut_groups_no_fixed_point,
    calculate_cut_groups_with_fixed_point,
    LineGroup,
} from "./calculate_cut_groups";
import { cut_with_fixed_point, cut_without_fixed_point, CutPart } from "./cut";
import { GlueIdent, GlueResult } from "./glue";

export type UnfoldCallback = <T extends SketchElement>(
    el: T,
    type: "mirror" | "original",
    original: T,
) => void;

// If fixed point is set, they wont be seperated there
export function cut(line: Line): [CutPart, CutPart];
export function cut(line: Line, group1: LineGroup): [CutPart, CutPart];
export function cut(
    line: Line,
    group1: LineGroup,
    group2: LineGroup,
): [CutPart, CutPart];

export function cut(line: Line[]): [CutPart, CutPart];
export function cut(line: Line[], group1: LineGroup): [CutPart, CutPart];
export function cut(
    line: Line[],
    group1: LineGroup,
    group2: LineGroup,
): [CutPart, CutPart];

export function cut(line: Line, fix_pt: Point): [CutPart, CutPart];
export function cut(
    line: Line,
    fix_pt: Point,
    group1: LineGroup,
): [CutPart, CutPart];
export function cut(
    line: Line,
    fix_pt: Point,
    group1: LineGroup,
    group2: LineGroup,
): [CutPart, CutPart];

export function cut(line: Line[], fix_pt: Point): [CutPart, CutPart];
export function cut(
    line: Line[],
    fix_pt: Point,
    group1: LineGroup,
): [CutPart, CutPart];
export function cut(
    line: Line[],
    fix_pt: Point,
    group1: LineGroup,
    group2: LineGroup,
): [CutPart, CutPart];

export function cut(
    line: Line | Line[],
    fixed_pt?: Point | "smart" | LineGroup | null,
    grp1?: LineGroup | "smart",
    grp2?: LineGroup,
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
        return (cut as any)([line], fixed_pt, grp1, grp2);
    }

    if (fixed_pt instanceof Point) {
        let grp1_arg: LineGroup | null = null;
        if (grp1 instanceof Array) {
            grp1_arg = grp1;
        }

        const cut_groups = calculate_cut_groups_with_fixed_point(
            line,
            fixed_pt,
            grp1_arg,
        );

        if (grp2) {
            Expect.that(
                cut_groups[1].every(grp2.includes) &&
                    grp2.every(cut_groups[1].includes),
                "Cut group specification is off",
            );
        }

        return cut_with_fixed_point(
            line,
            fixed_pt,
            cut_groups[0],
            cut_groups[1],
        );
    }

    let grp1_arg: LineGroup | null = null;
    if (fixed_pt instanceof Array) {
        grp1_arg = fixed_pt;
    }

    const cut_groups = calculate_cut_groups_no_fixed_point(line, grp1_arg);

    if (grp1 && grp1 instanceof Array) {
        Expect.that(
            cut_groups[1].every(grp1.includes) &&
                grp1.every(cut_groups[1].includes),
            "Cut group specification is off",
        );
    }

    return cut_without_fixed_point(line, cut_groups[0], cut_groups[1]);
}

// Merge the points without deleting them afterwards
export function glue(
    s: Sketch,
    ident1: GlueIdent,
    ident2: GlueIdent,
    data?: {
        points?: "merge" | Copy.CopySketchObjectDataCallback;
        lines?: "merge" | "delete" | "keep" | Copy.CopySketchObjectDataCallback;
    },
): GlueResult;
// Merge lines at glueing point (automatically removing lines between glueing points)
export function glue(
    s: Sketch,
    ident1: GlueIdent,
    ident2: GlueIdent,
    data: {
        points: "delete";
        lines?: Copy.CopySketchObjectDataCallback;
    },
): GlueResult;
export function glue(
    s: Sketch,
    ident1: GlueIdent,
    ident2: GlueIdent,
    data: Partial<{
        points: "merge" | "delete" | Copy.CopySketchObjectDataCallback;
        lines: "merge" | "delete" | "keep" | Copy.CopySketchObjectDataCallback;
    }> = {},
): GlueResult {
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
        typeof gpoints === "string" &&
        gpoints.startsWith("delete") &&
        typeof glines == "string"
    ) {
        glines = Copy.default_data_callback;
    }

    if (gpoints == "merge") {
        gpoints = Copy.default_data_callback;
    }

    if (glines == "merge") {
        glines = Copy.default_data_callback;
    }

    return glue_with_validated_input(s, ident1, ident2, {
        points: gpoints,
        lines: glines,
    });
}

export function anchor(s: Sketch, ...objects: SketchElement[]) {
    Expect.that(Validate.same_sketch(s, ...objects));

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

    let connected_component_points = CollectionMethods.connected_components(
        s,
    ).map((c) => c.filter((p) => p instanceof Point));

    if (objects.length > 0) {
        connected_component_points = connected_component_points.filter((c) => {
            return c.some((p) => pts.includes(p));
        });
    }

    for (let i = 1; i < connected_component_points.length; i++) {
        const a = s.line_between_points(
            connected_component_points[0]![0]!,
            connected_component_points[i]![0]!,
        );

        a.data = {
            __anchor: "true",
        };
    }

    return s;
}

export function remove_anchors(s: Sketch) {
    s.remove(...(CollectionMethods.lines_by_key(s, "_anchor")["true"] || []));
    return s;
}

export function path_between_points(
    p1: Point,
    p2: Point,
    line: Line | null = null,
) {
    if (line == null) {
        const adj = p1.adjacent_lines();
        Expect.that(adj.length == 1);
        line = adj[0]!;
    }

    const points: Point[] = [p1];
    const lines: Line[] = [line];
    let last_line_p2 = lines[0]!.other_endpoint(p1);
    while (last_line_p2 !== p2) {
        points.push(last_line_p2);
        const new_line = Expect.defined(
            last_line_p2
                .adjacent_lines()
                .find((l) => l != lines[lines.length - 1]!),
            "There is no path from p1 to p2.",
        );

        lines.push(new_line);

        Expect.that(last_line_p2 != p1, "There is no path from p1 to p2.");
        last_line_p2 = new_line.other_endpoint(last_line_p2);
    }
    points.push(p2);

    return {
        lines,
        points,
    };
}

export function decompress_components(s: Sketch) {
    const cc = CollectionMethods.connected_components(s);
    if (cc.length == 0) return s;

    const cols = Math.floor(Math.sqrt(cc.length) * 1.5);

    let current_TL = new Vector(0, 0);
    let current_index = 0;
    let max_height = 0;

    while (current_index < cc.length) {
        for (let i = 0; i < cols && current_index < cc.length; i++) {
            const c = cc[current_index]!;
            const bb = CollectionMethods.bounding_box(c);

            const off_by = current_TL.subtract(bb.top_left);
            c.filter((p) => p instanceof Point).forEach((pt) =>
                pt.offset_by(off_by),
            );

            current_index++;
            current_TL = new Vector(current_TL.x + bb.width + 3, current_TL.y);
            max_height = Math.max(max_height, bb.height);
        }

        current_TL = new Vector(0, current_TL.y + max_height + 3);
        max_height = 0;
    }

    return s;
}

export function unfold(
    s: Sketch,
    along_line: Line | [Point, Point],
    callback: UnfoldCallback = () => {},
) {
    if (along_line instanceof Line) {
        const tmp = along_line.endpoints();
        s.remove(along_line);
        along_line = tmp;
    }

    Expect.that(Validate.same_sketch(...along_line, s));

    const old_pts = s.points();
    const old_lines = s.lines();

    old_lines.forEach((l) => (l.data.__unfoldUID = tUID()));
    old_pts.forEach((p) => (p.data.__unfoldUID = tUID()));

    CollectionMethods.mirror(s, PlaneLine.VERTICAL);
    anchor(s);

    Copy.sketch(s, s);
    CollectionMethods.mirror([...old_lines, ...old_pts], PlaneLine.VERTICAL);

    const pt_pairs = old_pts.map((p) => {
        const pts = CollectionMethods.get_points(s, {
            __unfoldUID: p.data.__unfoldUID!,
        });
        if (pts[0] == p) return pts;
        return [pts[1]!, pts[0]!];
    });

    const ln_pairs = old_lines.map((l) => {
        const lns = CollectionMethods.get_lines(s, {
            __unfoldUID: l.data.__unfoldUID!,
        });
        if (lns[0] == l) return lns;
        return [lns[1]!, lns[0]!];
    });

    remove_underscore_attributes(s);

    const along_line_copy: [Point, Point] = [
        pt_pairs.find((p) => p[0] == along_line[0])![1]!,
        pt_pairs.find((p) => p[0] == along_line[1])![1]!,
    ];

    glue(s, along_line, along_line_copy, {
        points: (d) => d,
    });

    remove_anchors(s);

    pt_pairs.forEach((pair) => {
        callback(pair[0]!, "original", pair[0]!);
        callback(pair[1]!, "mirror", pair[0]!);
    });

    ln_pairs.forEach((pair) => {
        callback(pair[0]!, "original", pair[0]!);
        callback(pair[1]!, "mirror", pair[0]!);
    });
}

export function remove_underscore_attributes(s: Sketch, ...attr: string[]) {
    s.get_sketch_elements().forEach((p) => {
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

    return s;
}

export function delete_with_underscore_attributes(
    s: Sketch,
    ...attr: string[]
) {
    s.get_sketch_elements().forEach((p) => {
        for (const key of Object.keys(p.data)) {
            if (
                key.startsWith("__") &&
                (attr.length == 0 ||
                    attr.includes(key) ||
                    attr.includes(key.slice(2)))
            ) {
                s.remove(p);
            }
        }
    });

    return s;
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

function glue_with_validated_input(
    _s: Sketch,
    _ident1: any,
    _ident2: any,
    _arg3: {
        points: Copy.CopySketchObjectDataCallback | "delete";
        lines: Copy.CopySketchObjectDataCallback | "delete" | "keep";
    },
): GlueResult {
    throw new Error("Function not implemented.");
}
