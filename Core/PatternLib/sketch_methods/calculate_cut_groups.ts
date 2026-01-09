import { avoidant_connected_components, connected_hull, endpoint_hull } from "@/Core/StoffLib/collection";
import Line from "../../StoffLib/line";
import Point from "../../StoffLib/point";
import SketchElementCollection from "@/Core/StoffLib/sketch_element_collection";

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

    const components = avoidant_connected_components(
        connected_hull(new SketchElementCollection(lines)),
        endpoint_hull(new SketchElementCollection(lines))
    );

    assert(components.length < 3, "Cant deduce smart cut");
    const lines_grp1: Line[] = components[0]?.get_lines() || [];
    const lines_grp2: Line[] = components[1]?.get_lines() || [];
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
    const splitting_points = endpoint_hull(new SketchElementCollection(lines)).get_points().filter(
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

    const component_objects = avoidant_connected_components(
        connected_hull(new SketchElementCollection(lines)),
        endpoint_hull(new SketchElementCollection(lines))
    ).map(c => ({
        points: c.get_points(),
        lines: c.get_lines()
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
