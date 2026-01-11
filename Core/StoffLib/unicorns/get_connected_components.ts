import { ConnectedComponent } from "../connected_component.js";
import { Point } from "../point.js";
import { Line } from "../line.js";
import { Sketch } from "../sketch.js";
import { SketchElement } from "../types.js";

export function get_connected_components(
    sketch: Sketch
): ConnectedComponent[] {
    let points: Point[] = sketch.get_points();
    if (points.length === 0) return [];

    const components: SketchElement[][] = [];

    while (points.length > 0) {
        let currentlyVisiting = points[0];

        const visitedPoints: Point[] = [];
        const visitedLines: Line[] = [];
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
            (visitedPoints as SketchElement[]).concat(visitedLines)
        );

        points = points.filter(
            p => !visitedPoints.includes(p)
        );
    }

    return components.map(
        c => new ConnectedComponent(c[0])
    );
}
