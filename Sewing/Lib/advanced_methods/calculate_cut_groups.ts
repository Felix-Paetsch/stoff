import { CollectionMethods, Expect, Line, Point } from "@/Core";

// Lines that belong to one side of a cut
export type LineGroup = Line[];

export function calculate_cut_groups_no_fixed_point(
    lines: Line[],
    group1: LineGroup | null = null,
): [LineGroup, LineGroup] {
    if (group1 !== null) {
        const other_lines = lines.flatMap((l) => l.adjacent_lines());
        const filtered = other_lines.filter(
            (l) => !lines.includes(l) && !group1.includes(l),
        );

        return [group1, filtered];
    }

    const line_endpoint_hull = CollectionMethods.endpoint_hull(lines);
    const components = CollectionMethods.connected_hull_components(
        CollectionMethods.connected_hull(lines).filter(
            (x) => !line_endpoint_hull.includes(x),
        ),
    );

    Expect.that(components.length < 3, "Cant deduce smart cut");
    const lines_grp1: Line[] = CollectionMethods.get_lines(components[0] || []);
    const lines_grp2: Line[] = CollectionMethods.get_lines(components[1] || []);
    return [
        lines_grp1.filter((l) => lines.some((line) => l.is_adjacent(line))),
        lines_grp2.filter((l) => lines.some((line) => l.is_adjacent(line))),
    ];
}

export function calculate_cut_groups_with_fixed_point(
    lines: Line[],
    pt: Point,
    group1: LineGroup | null = null,
): [LineGroup, LineGroup] {
    const splitting_points = CollectionMethods.get_points(
        CollectionMethods.endpoint_hull(lines),
    ).filter((p) => p !== pt);

    if (group1 !== null) {
        const other_lines = splitting_points.flatMap((p) => p.adjacent_lines());
        const filtered = other_lines.filter(
            (l) => !lines.includes(l) && !group1.includes(l),
        );

        return [group1, filtered];
    }

    const line_endpoint_hull = CollectionMethods.endpoint_hull(lines);
    const component_objects = CollectionMethods.connected_hull_components(
        CollectionMethods.connected_hull(lines).filter(
            (x) => !line_endpoint_hull.includes(x),
        ),
    ).map((c) => ({
        points: CollectionMethods.get_points(c),
        lines: CollectionMethods.get_lines(c),
    }));

    const relevant_components = component_objects.filter((c) =>
        c.points.some((p) => splitting_points.includes(p)),
    );

    Expect.that(relevant_components.length < 3, "Cant deduce smart cut");
    const lines_grp1: Line[] = relevant_components[0]?.lines || [];
    const lines_grp2: Line[] = relevant_components[1]?.lines || [];
    return [
        lines_grp1.filter((l) => lines.some((line) => l.is_adjacent(line))),
        lines_grp2.filter((l) => lines.some((line) => l.is_adjacent(line))),
    ];
}
