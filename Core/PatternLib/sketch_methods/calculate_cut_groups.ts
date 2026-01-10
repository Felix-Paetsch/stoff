import * as CollectionMethods from "@/Core/StoffLib/collection";
import Line from "../../StoffLib/line";
import Point from "../../StoffLib/point";

export type LineGroup = Line[];

export function calculate_cut_groups_no_fixed_point(
    lines: Line[],
    group1: LineGroup | null = null
): [LineGroup, LineGroup] {
    if (group1 !== null) {
        const other_lines = lines.flatMap(l => l.get_adjacent_lines());
        const filtered = other_lines.filter(l => !lines.includes(l) && !group1.includes(l))

        return [
            group1,
            filtered
        ]
    }

    const components = CollectionMethods.avoidant_connected_components(
        CollectionMethods.connected_hull(lines),
        CollectionMethods.endpoint_hull(lines)
    );

    assert(components.length < 3, "Cant deduce smart cut");
    const lines_grp1: Line[] = CollectionMethods.get_lines(components[0] || []);
    const lines_grp2: Line[] = CollectionMethods.get_lines(components[1] || []);
    return [
        lines_grp1.filter(l => lines.some(line => l.is_adjacent(line))),
        lines_grp2.filter(l => lines.some(line => l.is_adjacent(line)))
    ]
}

export function calculate_cut_groups_with_fixed_point(
    lines: Line[],
    pt: Point,
    group1: LineGroup | null = null
): [LineGroup, LineGroup] {
    const splitting_points = CollectionMethods.get_points(
        CollectionMethods.endpoint_hull(lines)
    ).filter(
        p => p !== pt
    );

    if (group1 !== null) {
        const other_lines = splitting_points.flatMap(l => l.get_adjacent_lines());
        const filtered = other_lines.filter(l => !lines.includes(l) && !group1.includes(l))

        return [
            group1,
            filtered
        ]
    }

    const component_objects = CollectionMethods.avoidant_connected_components(
        CollectionMethods.connected_hull(lines),
        CollectionMethods.endpoint_hull(lines)
    ).map(c => ({
        points: CollectionMethods.get_points(c),
        lines: CollectionMethods.get_lines(c)
    }));

    const relevant_components = component_objects.filter(
        c => c.points.some(p => splitting_points.includes(p))
    );


    assert(relevant_components.length < 3, "Cant deduce smart cut");
    const lines_grp1: Line[] = relevant_components[0]?.lines || [];
    const lines_grp2: Line[] = relevant_components[1]?.lines || [];
    return [
        lines_grp1.filter(l => lines.some(line => l.is_adjacent(line))),
        lines_grp2.filter(l => lines.some(line => l.is_adjacent(line)))]
}
