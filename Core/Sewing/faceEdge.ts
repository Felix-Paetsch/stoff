import { Line } from "../StoffLib/line.js";
import Point from "../StoffLib/point.js";
import SketchElementCollection from "../StoffLib/sketch_element_collection.js";
import { EPS, eps_equal } from "../StoffLib/geometry.js";
import { FaceCarousel } from "./faceCarousel.ts";
import { SewingPoint } from "./sewingPoint.ts";
import { Sewing } from "./sewing.ts";

export type FaceEdgeComponent = {
    line: Line,
    standard_handedness: boolean,
    standard_orientation: boolean,
    position: [number, number] // 0 <= x < y <= 1
};

export class FaceEdge {
    constructor(
        readonly face_carousel: FaceCarousel,
        readonly lines: FaceEdgeComponent[], // We assume they are consecutive (or at least could be)
    ) { }

    get outdated(): boolean {
        return this.face_carousel.outdated;
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

    get_length(): number {
        let res = 0;
        this.lines.forEach(l => {
            res += l.line.get_length() * (l.position[1] - l.position[0]);
        })
        return res;
    }

    static get_length(fpc: FaceEdgeComponent): number {
        return fpc.line.get_length() * (fpc.position[1] - fpc.position[0]);
    }

    position(fec: FaceEdgeComponent): [number, number] {
        let start_position = 0;
        for (const l of this.lines) {
            if (l !== fec) {
                start_position += l.line.get_length() * (l.position[1] - l.position[0]);
                continue;
            }

            const start = fec.standard_orientation ? fec.position[0] : 1 - fec.position[1];
            const fec_length = fec.line.get_length() * (fec.position[1] - fec.position[0]);
            const this_length = this.get_length();
            const start_pos = (start_position + start * fec_length) / this_length;

            return [
                start_pos,
                start_pos + fec_length / this_length
            ];
        }
        throw new Error("FaceEdgeComponent not found in FaceEdge");
    }

    connected_horizontally(other: FaceEdge, at?: SewingPoint): boolean {
        return [
            [this.lines[0], other.lines[0]],
            [this.lines[0], other.lines[1]],
            [this.lines[1], other.lines[0]],
            [this.lines[1], other.lines[1]],
        ].some(([c1, c2]) => face_edge_component_connected_to_horizontally(this.face_carousel.sewingLine.sewing, c1, c2, at));
    }
}

function face_edge_component_connected_to_horizontally(sewing: Sewing, component: FaceEdgeComponent, other: FaceEdgeComponent, at?: SewingPoint): boolean {
    if (!at) {
        const line1 = component.line;
        const line2 = other.line;

        if (component.line == other.line) {
            return eps_equal(component.position[0], other.position[1], EPS.COARSE)
                || eps_equal(component.position[1], other.position[0], EPS.COARSE);
        }
    }

    if (component.line == other.line) return false;
    if (!at) return face_edge_component_connected_to_horizontally(sewing, component, other, sewing.sewing_point(component.line.p1))
        || face_edge_component_connected_to_horizontally(sewing, component, other, sewing.sewing_point(component.line.p2));

    const p1s = at.points.filter((p) => component.line.has_endpoint(p));
    const p2s = at.points.filter((p) => other.line.has_endpoint(p));

    for (const p1 of p1s) {
        for (const p2 of p2s) {
            if (
                (p1 == component.line.p1 && component.position[0] > 0)
                || (p1 == component.line.p2 && component.position[1] < 1)
            ) continue;
            if (
                (p2 == other.line.p1 && other.position[0] > 0)
                || (p2 == other.line.p2 && other.position[1] < 1)
            ) continue;

            for (const l1 of p1.get_lines()) {
                for (const l2 of p2.get_lines()) {
                    if (lines_vertically_adjacent(sewing, l1, l2, p1, p2)) return true;
                }
            }
        }
    }

    return false;
}

function lines_vertically_adjacent(sewing: Sewing, l1: Line, l2: Line, p1: Point, p2: Point): boolean {
    if (!sewing.is_sewing_point(p1)) return false;
    const sp1 = sewing.sewing_point(p1);
    if (!sp1.is(p2)) return false;
    if (!sewing.has_sewing_line(l1)) return false;

    const sewing_line = sewing.sewing_line(l1);
    if (!sewing.sewing_line(l1).get_lines().includes(l2)) return false;

    const l1_component = sewing_line.primary_component.concat(sewing_line.other_components).find((c) => c.line == l1)!;
    const l2_component = sewing_line.primary_component.concat(sewing_line.other_components).find((c) => c.line == l2)!;
    return eps_equal(l1_component.position_at_sewing_line[0], l2_component.position_at_sewing_line[1], EPS.COARSE)
        || eps_equal(l1_component.position_at_sewing_line[1], l2_component.position_at_sewing_line[0], EPS.COARSE);
}