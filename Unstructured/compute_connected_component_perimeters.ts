import {
    BoundingBox,
    Bounds,
    CollectionMethods,
    EPS,
    Interval,
    Line,
    PlaneLine,
    Point,
    SketchElement,
    SketchElementCollection,
    Vector,
} from "@/Core";

export type Attachment = {
    at: Point;
    to: Loop | LooseSegment;
};

export type LooseSegment = {
    lines: Line[];
    points: Point[];
    attachments: Attachment[];
};

export type Loop = {
    lines: Line[];
    points: Point[];
    attachments: Attachment[];
    interior: SketchElement[];
};

export type ConnectedComponentPerimeter = {
    lines: Line[];
    points: Point[];
    loops: Loop[];
    loose_segments: LooseSegment[];
    walk: Line[];
};

/*
 * In: a sketch element collection such that no connected component has
 *
 *      - self intersecting lines
 *      - or unmarked intersections between other lines
 *          (i.e. for every intersection there must be a point there)
 *      - no two lines (on points of the perimeter) have exactly the same tangent vector at that point
 *
 * Out: For each connected component a ConnectedComponentPerimeter organized as follows:
 *
 * __walk__ goes in clockwise direction once around the shape, potentially walking lines twice if they are loose segments
 * __lines__ is the walk without duplicate lines
 * __points__ is the set of points on the perimeter (without dups)
 * __loose_segments_ and array of loose segments
 *       a loose segment is a sequence of lines after another which doesnt belong to a loop and doesnt branch
 *       __attachments__ it is situated between two of the following: Loop, End without anything (no attachment), A branching point for loose segments/loops (pot. multiple attachments)
 *       __lines__ appear only once and go from one end to the other
 *       __points__ also go from the same first end to the other and have length of the lines + 1
 * __loop__ a loop is a clockwise collection of line segments which are closed
 *       __lines__ clockwise oriented lines forming a loop. Potentially only one line (polygon) in which case clockwise-ness is not guaranteed
 *       __points__ clockwise orderet starting at the start point of the first line with regard to the line sequence (and not if it acutally is line.p1)
 *           same number of points as lines
 *       __attachments__ contact points to other (outside) loops and segments
 *       __interior__ collection of lines and points of the connected component which are situated properly within the loop. In particular the edge points are not included
 *
 * */
export function compute_connected_component_perimeters(
    on: SketchElementCollection,
): ConnectedComponentPerimeter[] {
    const sec_array = CollectionMethods.sketch_element_collection_as_array(on);
    const cleaned_array = CollectionMethods.endpoint_hull(
        CollectionMethods.unique(sec_array),
    );

    const components = CollectionMethods.connected_components(cleaned_array);
    return components.map(
        (c) => compute_single_connected_component_perimeter(c)!,
    );
}

function compute_single_connected_component_perimeter(
    on: SketchElement[],
): null | ConnectedComponentPerimeter {
    const pts = on.filter((e) => e instanceof Point);
    const lns = on.filter((e) => e instanceof Line);

    if (pts.length == 0) {
        return null;
    }

    if (lns.length == 0) {
        return {
            lines: lns,
            points: pts,
            loops: [],
            loose_segments: [],
            walk: lns,
        };
    }

    const left_most = compute_left_most_lines(lns);
    const incidence_nodes = create_incidence_nodes(pts, lns);
    const starting_LineWithDirection = compute_starting_LineWithDirection(
        left_most,
        incidence_nodes,
    );

    const hull = walk_outer_hull(starting_LineWithDirection);
    const hull_parts = compute_perimeter_constituents_from_hull(hull);

    return build_hull_perimeter(hull, hull_parts, on);
}

type LineWithDirection = {
    outgoing_vec: Vector;
    start: IncidenceNode;
    line: Line;
    end: IncidenceNode;
    anchor: "line_p1" | "line_p2";
};
type IncidenceNode = {
    point: Point;
    lines: LineWithDirection[];
};

function find_last_index<T>(
    arr: T[],
    condition: (test: T) => boolean,
): number | undefined {
    for (let i = arr.length - 1; i >= 0; i--) {
        if (condition(arr[i]!)) {
            return i;
        }
    }
}

function build_hull_perimeter(
    hull: LineWithDirection[],
    hull_parts: ReturnType<typeof compute_perimeter_constituents_from_hull>,
    sketch_element_col: SketchElement[],
): ConnectedComponentPerimeter {
    const loops: Loop[] = hull_parts.loop_lines.map((lines) => {
        return {
            lines: lines.map((l) => l.line),
            points: lines.map((l) => l.start.point),
            attachments: [],
            interior: compute_loop_interior(lines, sketch_element_col),
        };
    });

    const segments: LooseSegment[] = hull_parts.segment_lines.map((lines) => {
        return {
            lines: CollectionMethods.unique(lines.map((l) => l.line)),
            points: lines
                .map((l) => l.start.point)
                .concat(lines[lines.length - 1]!.end.point),
            attachments: [],
        };
    });

    for (let loop_index = 0; loop_index < loops.length; loop_index++) {
        const loop = loops[loop_index]!;
        for (
            let other_loop_index = loop_index + 1;
            other_loop_index < loops.length;
            other_loop_index++
        ) {
            const other_loop = loops[other_loop_index]!;

            for (let p of loop.points) {
                const q = other_loop.points.find((q) => q == p);
                if (!q) continue;

                loop.attachments.push({
                    at: p,
                    to: other_loop,
                });

                other_loop.attachments.push({
                    at: p,
                    to: loop,
                });
            }
        }

        for (
            let segment_index = 0;
            segment_index < segments.length;
            segment_index++
        ) {
            const segment = segments[segment_index]!;

            for (let p of loop.points) {
                const q = [
                    segment.points[0]!,
                    segment.points[segment.points.length - 1]!,
                ].find((q) => q == p);
                if (!q) continue;

                loop.attachments.push({
                    at: p,
                    to: segment,
                });

                segment.attachments.push({
                    at: q,
                    to: loop,
                });
            }
        }
    }

    return {
        lines: CollectionMethods.unique(hull.map((l) => l.line)),
        points: CollectionMethods.unique(hull.map((l) => l.start.point)),
        loops,
        loose_segments: segments,
        walk: hull.map((l) => l.line),
    };
}

function compute_loop_interior(
    loop_lines_with_directions: LineWithDirection[],
    sketch_element_col: SketchElement[],
): SketchElement[] {
    const inner_attached_lines: Line[] = [];

    for (let i = 0; i < loop_lines_with_directions.length; i++) {
        const line_with_dir = loop_lines_with_directions[i]!;
        const prev_line_with_dir =
            loop_lines_with_directions[
                (i - 1 + loop_lines_with_directions.length) %
                    loop_lines_with_directions.length
            ]!;

        const cw_spanning_vecs: [Vector, Vector] = [
            line_with_dir.outgoing_vec,
            other_side_of_line_with_direction(prev_line_with_dir).outgoing_vec,
        ];
        const max_angle = Vector.angle_clockwise(
            cw_spanning_vecs[0],
            cw_spanning_vecs[1],
        );

        const pt = line_with_dir.start.point;
        for (const test_ln of pt.adjacent_lines()) {
            const vec: Vector = pt.outgoing_vector(test_ln);
            const angle = Vector.angle_clockwise(cw_spanning_vecs[0], vec);
            if (
                0 < angle &&
                angle < max_angle &&
                !inner_attached_lines.includes(test_ln)
            ) {
                inner_attached_lines.push(test_ln);
            }
        }
    }

    const loop_points = loop_lines_with_directions.map((l) => l.start.point);
    const hull_objects_without_loop = sketch_element_col.filter(
        (element) => !loop_points.some((p) => element == p),
    );

    const inner_objects: SketchElement[] = [];
    for (const attached_line of inner_attached_lines) {
        if (!inner_objects.includes(attached_line)) {
            inner_objects.push(
                ...CollectionMethods.connected_component(
                    hull_objects_without_loop,
                    attached_line,
                ),
            );
        }
    }

    return inner_objects;
}

function compute_perimeter_constituents_from_hull(hull: LineWithDirection[]): {
    loop_lines: LineWithDirection[][];
    segment_lines: LineWithDirection[][];
} {
    hull = [...hull];
    const walking_stack: LineWithDirection[] = [hull.shift()!];

    const loop_lines: LineWithDirection[][] = [];
    const loose_segment_lines: LineWithDirection[][] = [];

    while (hull.length > 0) {
        const next_path = hull.shift()!;
        const last_matching_line_end_index = find_last_index(
            walking_stack,
            (d) => d.start == next_path.end,
        );

        if (last_matching_line_end_index === undefined) {
            walking_stack.push(next_path);
            continue;
        }

        const last_matching_line_end =
            walking_stack[last_matching_line_end_index]!;
        if (
            last_matching_line_end !=
            other_side_of_line_with_direction(next_path)
        ) {
            // It is a loop
            walking_stack.push(next_path);
            loop_lines.push(walking_stack.splice(last_matching_line_end_index));
            if (walking_stack.length == 0 && hull.length > 0) {
                walking_stack.push(hull.pop()!);
            }
            continue;
        }

        // It is a loose segment
        // It is guaranteed to be the last item of the walking_stack
        walking_stack.pop();
        const loose_segment_head: LineWithDirection[] = [next_path];

        while (hull.length > 0) {
            const next = hull[0]!;
            if (
                other_side_of_line_with_direction(next) ==
                walking_stack[walking_stack.length - 1]
            ) {
                loose_segment_head.push(hull.shift()!);
                walking_stack.pop();
                if (hull.length == 0 && walking_stack.length == 0) {
                    loose_segment_lines.push(loose_segment_head);
                }
            } else {
                loose_segment_lines.push(loose_segment_head);
                break;
            }

            if (walking_stack.length == 0 && hull.length > 0) {
                walking_stack.push(hull.pop()!);
            }
        }
    }

    if (hull.length > 0) {
        throw new Error("Bad hull provided");
    }

    if (walking_stack.length > 0) {
        if (
            walking_stack[0]!.start ==
            walking_stack[walking_stack.length - 1]!.end
        ) {
            loop_lines.push(walking_stack);
        } else {
            throw new Error("Something went wrong");
        }
    }

    return {
        loop_lines: loop_lines,
        segment_lines: loose_segment_lines,
    };
}

function other_side_of_line_with_direction(
    current: LineWithDirection,
): LineWithDirection {
    const incomming_node = current.end;
    return incomming_node.lines.find(
        (l) => l.line == current.line && l !== current,
    )!;
}

function walk_outer_hull(start: LineWithDirection): LineWithDirection[] {
    const res: LineWithDirection[] = [];
    let current = start;

    const inf_loop_guard = Bounds.guard_inf_loop();

    while (!res.includes(current) && inf_loop_guard()) {
        res.push(current);
        const incomming_node = current.end;
        const come_from_direction = other_side_of_line_with_direction(current);
        const sorted_directions = sorted_at_incidence_node_relative_to(
            incomming_node,
            come_from_direction,
        );
        current = sorted_directions[0]!;
    }

    return res;
}

function sorted_at_incidence_node_relative_to(
    node: IncidenceNode,
    to: LineWithDirection | Vector,
): LineWithDirection[] {
    // First assume to is a Vector
    // Then we see it as the vector from the point outwards
    // We sort the lines starting at the vector in clockwise direction. If a vector directly agrees, we see it as the least element. If two elements are "the least element" it is U.B. as we coun't it as self-intersection
    // Now if to is an LineWithDirection, we sort all other lines regarding to its vector.

    if (!(to instanceof Vector)) {
        to = to.outgoing_vec;
    }

    const lines_with_angles = node.lines.map((l) => {
        const a = Vector.angle_clockwise(to, l.outgoing_vec);
        return [l, a == 0 ? 2 * Math.PI : a] as [LineWithDirection, number];
    });
    lines_with_angles.sort(([_, a], [__, b]) => a - b);

    return lines_with_angles.map(([a, _]) => a);
}

function create_incidence_nodes(pts: Point[], lns: Line[]): IncidenceNode[] {
    const node_by_point = new Map<Point, IncidenceNode>();
    for (const p of pts) {
        node_by_point.set(p, {
            point: p,
            lines: [],
        });
    }

    for (const l of lns) {
        const node1 = node_by_point.get(l.p1)!;
        const node2 = node_by_point.get(l.p2)!;

        const directed_line1: LineWithDirection = {
            outgoing_vec: l.shape.tangent_vector("start")!,
            start: node1,
            line: l,
            end: node2,
            anchor: "line_p1",
        };

        const directed_line2: LineWithDirection = {
            outgoing_vec: l.shape.tangent_vector("end")!.invert(),
            start: node2,
            line: l,
            end: node1,
            anchor: "line_p2",
        };

        node1.lines.push(directed_line1);
        node2.lines.push(directed_line2);
    }

    return Array.from(node_by_point.values());
}

function compute_left_most_lines(lns: Line[]): Line[] {
    const x_lns = lns.map((l) => [l, l.bounding_box().min_x] as [Line, number]);
    let min_ln = x_lns[0]!;
    for (let i = 1; i < x_lns.length; i++) {
        if (min_ln[1] > x_lns[i]![1]) {
            min_ln = x_lns[i]!;
        }
    }

    return x_lns.filter(([_, b]) => b == min_ln[1]).map((l) => l[0]);
}

type SweepAxis = "horizontal" | "vertical";

function compute_starting_LineWithDirection(
    lns: Line[],
    nodes: IncidenceNode[],
): LineWithDirection {
    const w_lns = lns.map((l) => [l, l.bounding_box()] as [Line, BoundingBox]);
    let min_ln = w_lns[0]!;
    for (let i = 1; i < w_lns.length; i++) {
        if (min_ln[1].min_x > w_lns[i]![1].min_x) {
            min_ln = w_lns[i]!;
        }
    }

    const x_min_lns = w_lns.filter((w) => w[1].min_x == min_ln[1].min_x);
    x_min_lns.sort((a, b) => a[1].width - b[1].width);

    if (x_min_lns[0]![1].width < EPS.tiny) {
        return compute_starting_LineWithDirection_bySweep(
            x_min_lns[0]![0],
            nodes,
            "horizontal",
        );
    }

    // Take a vertical line in generic x-position, intersect all candidate lines,
    // and choose the one with the highest intersection (hit from above first).
    const x_line_intervals: Interval.Interval[] = x_min_lns.map(
        ([_, b]) => [b.min_x, b.max_x] as Interval.Interval,
    );
    const range = Interval.merge(...x_line_intervals);
    const x_exclude = x_min_lns.flatMap(([l, b]) => [
        b.min_x,
        b.max_x,
        l.p1.vec.x,
        l.p2.vec.x,
    ]);

    const pos = Interval.generic_position(range, x_exclude);
    const test_plain_line = new PlaneLine([
        new Vector(pos, 0),
        new Vector(pos, 1),
    ]);

    const intersections = x_min_lns.map(([l]) => {
        const ips = l.shape.intersection_positions(test_plain_line);
        ips.sort((a, b) => a.vec.y - b.vec.y);
        if (ips.length > 0) return ips[0]!;
        return null;
    });

    const correct_line_index = intersections.findIndex((p) => {
        if (p == null) return false;
        return intersections.every((i) => i == null || i.vec.y >= p.vec.y);
    });

    return compute_starting_LineWithDirection_bySweep(
        x_min_lns[correct_line_index]![0],
        nodes,
        "vertical",
    );
}

function compute_starting_LineWithDirection_bySweep(
    l: Line,
    nodes: IncidenceNode[],
    axis: SweepAxis,
): LineWithDirection {
    const lbb = l.bounding_box();

    const sweepExtent: Interval.Interval =
        axis === "horizontal" ? [lbb.min_y, lbb.max_y] : [lbb.min_x, lbb.max_x];

    const sweepSize = sweepExtent[1] - sweepExtent[0];
    if (sweepSize < EPS.tiny) {
        throw new Error("Sketch contained a line with too tiny bounding box");
    }

    const avoid_positions =
        axis === "horizontal"
            ? [l.p1.vec.y, l.p2.vec.y]
            : [l.p1.vec.x, l.p2.vec.x];

    let pos = Interval.generic_position(sweepExtent, avoid_positions);

    while (true) {
        const plainLine =
            axis === "horizontal"
                ? new PlaneLine(new Vector(0, pos), new Vector(1, pos))
                : new PlaneLine(new Vector(pos, 0), new Vector(pos, 1));

        const intersections = l.shape.intersection_positions(plainLine);

        intersections.sort((a, b) =>
            axis === "horizontal" ? a.vec.x - b.vec.x : a.vec.y - b.vec.y,
        );

        const firstIntersection = intersections[0]!;
        const outgoing_vector = axis === "horizontal" ? Vector.LEFT : Vector.UP;
        const tangent_vector = l.shape.tangent_vector(firstIntersection)!;

        const angle = Vector.angle_clockwise(
            outgoing_vector,
            tangent_vector,
            "minusPiToPi",
        );

        if (Math.abs(angle) > EPS.tiny ** 2) {
            if (angle > 0) {
                const node = nodes.find((n) => n.point == l.p1)!;
                return node.lines.find(
                    (line) => line.line == l && line.anchor == "line_p1",
                )!;
            }

            const node = nodes.find((n) => n.point == l.p2)!;
            return node.lines.find(
                (line) => line.line == l && line.anchor == "line_p2",
            )!;
        }

        avoid_positions.push(pos);
        pos = Interval.generic_position(sweepExtent, avoid_positions);
    }
}
