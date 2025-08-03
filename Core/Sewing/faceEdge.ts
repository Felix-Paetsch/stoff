import { Line } from "../StoffLib/line.js";
import Point from "../StoffLib/point.js";
import SketchElementCollection from "../StoffLib/sketch_element_collection.js";
import { EPS } from "../StoffLib/geometry.js";
import { FaceCarousel } from "./faceCarousel.ts";

export type FaceEdgeComponent = {
    line: Line,
    standard_handedness: boolean,
    position: number | [number, number] // from the SewingLine orientation;
    // -1 < x < 0 or 0 < x <= 1; 0 <= x < y <= 1
};

export class FaceEdge {
    public outdated: boolean;

    constructor(
        readonly face_carousel: FaceCarousel,
        readonly lines: FaceEdgeComponent[],
    ) {
        this.outdated = false;
    }

    get_lines(): Line[] {
        return this.lines.map((l) => l.line);
    }

    get_points(): Point[] {
        const points = new SketchElementCollection();
        for (const component of this.lines) {
            let includeP1 = false;
            let includeP2 = false;

            if (typeof component.position === "number") {
                const pos = component.position;
                if (pos > 0) {
                    includeP1 = true;
                    includeP2 = 1 - pos < EPS.COARSE;
                } else {
                    includeP2 = true;
                    includeP1 = pos + 1 < EPS.COARSE;
                }
            } else {
                const [x, y] = component.position;
                includeP1 = x < EPS.COARSE;
                includeP2 = y > 1 - EPS.COARSE;
            }

            includeP1 && points.push(component.line.p1);
            includeP2 && points.push(component.line.p2);
        }
        return (points as any).unique();
    }

    updated(): FaceEdge {
        const updated_carousel = this.face_carousel.updated();
        return updated_carousel.faceEdges.filter((fe) => fe.edge.contains(this))[0].edge;
    }

    contains(things: Line | Point | FaceEdge): boolean;
    contains(things: (Line | Point | FaceEdge)[]): boolean;
    contains(things: Line | Point | FaceEdge | (Line | Point | FaceEdge)[]): boolean {
        // Maybe for a face edge we want to check the ranges. But then we need to translate them to absolutes.
        const own_lines = this.get_lines();
        const own_points = this.get_points();

        if (!Array.isArray(things)) {
            things = [things];
        }
        for (const thing of things) {
            if (thing instanceof Line) {
                if (!own_lines.some((l) => l === thing)) {
                    return false;
                }
            } else if (thing instanceof FaceEdge) {
                const thing_lines = thing.get_lines();
                if (!own_lines.every((l) => thing_lines.some((l2) => l === l2))) {
                    return false;
                }
            } else if (!own_points.includes(thing)) {
                return false;
            }
        }

        return true;
    }

    get_length() {
        return this.get_lines().reduce((acc, l) => acc + l.get_length(), 0);
    }
}