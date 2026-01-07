import ConnectedComponent from "../connected_component.js";
import {
    SketchElement,
    SketchElementCollectionLike,
} from "../types.js";
import SketchElementCollection from "../sketch_element_collection.js";
import Point from "../point.js";
import Line from "../line.js";
import Sketch from "../sketch.js";

export function get_connected_components(
    sketch: Sketch
): ConnectedComponent[] {
    let points: Point[] = sketch.get_points();
    if (points.length === 0) return [];

    const components: SketchElementCollection[] = [];

    while (points.length > 0) {
        let currentlyVisiting = points[0];

        const visitedPoints = new SketchElementCollection<Point>([]);
        const visitedLines = new SketchElementCollection<Line>([]);
        const toVisit: Point[] = [currentlyVisiting];

        while (toVisit.length > 0) {
            currentlyVisiting = toVisit.pop()!;

            if (visitedPoints.includes(currentlyVisiting)) continue;

            const nextLines = currentlyVisiting
                .get_adjacent_lines()

            for (const line of nextLines) {
                if (!visitedLines.includes(line)) {
                    visitedLines.push(line);
                    toVisit.push(...line.get_endpoints());
                }
            }

            visitedPoints.push(currentlyVisiting);
        }

        components.push(
            visitedPoints.concat(visitedLines)
        );

        points = points.filter(
            p => !visitedPoints.includes(p)
        );
    }

    return components.map(
        c => new ConnectedComponent(c[0])
    );
}
