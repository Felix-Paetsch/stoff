import { Graph, Line, Point } from "@/Core";

export function order_lines(...lines: Line[]): {
    lines: Line[];
    orientations: boolean[];
    points: Point[];
} | null {
    if (lines.length == 0) {
        return {
            lines: [],
            orientations: [],
            points: [],
        };
    }

    if (lines.length == 1) {
        return {
            lines: [...lines],
            orientations: [true],
            points: [lines[0]!.p1, lines[0]!.p2],
        };
    }

    const g = Graph.sketch_element_collection_to_shape_graph(
        lines,
        "endpoint_hull",
    );
    const tour = Graph.euler_tour(g);
    if (!tour) return null;

    const ordered = tour.map((l) => lines[l.index]!);
    const start_with_currect_orientation = ordered[1]!.has_endpoint(
        ordered[0]!.p2,
    );

    const orientations: boolean[] = [start_with_currect_orientation];
    let traveling_point: Point = start_with_currect_orientation
        ? ordered[0]!.p1
        : ordered[0]!.p2;
    const points: Point[] = [traveling_point];

    for (let i = 0; i < ordered.length; i++) {
        orientations.push(ordered[i]!.same_orientation(traveling_point));

        traveling_point = ordered[i]!.other_endpoint(traveling_point);
        points.push(traveling_point);
    }

    return {
        lines: ordered,
        orientations: orientations,
        points: points,
    };
}
