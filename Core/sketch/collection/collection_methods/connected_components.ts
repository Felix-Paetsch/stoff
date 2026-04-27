import { sketch_element_collection_as_array } from "..";
import { Line } from "../../line";
import { Point } from "../../point";
import { SketchElement, SketchElementCollection } from "../../types";
import { get_lines, get_points } from "./getter_methods";

export function connected_component(
    sc: SketchElementCollection,
    root_el: SketchElement,
): SketchElement[] {
    let currently_visiting_point;
    let pts = get_points(sc);
    let lns = get_lines(sc);

    if (root_el instanceof Point) {
        currently_visiting_point = root_el;
    } else {
        if (!lns.includes(root_el)) return [];
        if (pts.includes(root_el.p1)) {
            currently_visiting_point = root_el.p1;
        } else if (pts.includes(root_el.p2)) {
            currently_visiting_point = root_el.p2;
        } else {
            return [root_el];
        }
    }

    const visited_points: Point[] = [];
    const visited_lines: Line[] = [];
    const to_visit_points: Point[] = [currently_visiting_point];

    while (to_visit_points.length > 0) {
        currently_visiting_point = to_visit_points.pop()!;
        if (
            visited_points.includes(currently_visiting_point) ||
            !pts.includes(currently_visiting_point)
        ) {
            continue;
        }
        for (const line of currently_visiting_point
            .adjacent_lines()
            .filter((l) => lns.includes(l))) {
            if (!visited_lines.includes(line)) {
                visited_lines.push(line);
                to_visit_points.push(line.p1, line.p2);
            }
        }
        visited_points.push(currently_visiting_point);
    }

    return (visited_points as SketchElement[]).concat(
        visited_lines as SketchElement[],
    );
}

export function connected_components(
    sc: SketchElementCollection,
): SketchElement[][] {
    const components: SketchElement[][] = [];
    const sea = sketch_element_collection_as_array(sc);

    for (const se of sea) {
        if (components.some((c) => c.some((o) => o == se))) {
            continue;
        }

        components.push(connected_component(sc, se));
    }

    return components;
}
