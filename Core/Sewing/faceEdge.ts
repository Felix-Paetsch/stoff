import Line from "../StoffLib/line.js";
import Point from "../StoffLib/point.js";
import { EPS, eps_equal } from "../StoffLib/geometry.js";
import { FaceCarousel } from "./faceCarousel.ts";
import { SewingPoint } from "./sewingPoint.ts";
import { Sewing } from "./sewing.ts";
import { interval_overlap } from "../StoffLib/geometry/1d.ts";

export type FaceEdgeComponent = {
    line: Line,
    standard_handedness: boolean, // The line handedness points to the face
    standard_orientation: boolean
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
        return Array.from(new Set(this.lines.flatMap(l => l.line.get_endpoints())));
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
            res += l.line.get_length();
        })
        return res;
    }

    static get_length(fpc: FaceEdgeComponent): number {
        return fpc.line.get_length();
    }

    position(fec: FaceEdgeComponent): [number, number] {
        let start_position = 0;
        for (const l of this.lines) {
            if (l !== fec) {
                start_position += l.line.get_length();
                continue;
            }

            const fec_length = fec.line.get_length();
            const this_length = this.get_length();
            const start_pos = start_position / this_length;

            return [
                start_pos,
                start_pos + fec_length / this_length
            ];
        }
        throw new Error("FaceEdgeComponent not found in FaceEdge");
    }

    connected_horizontally(other: FaceEdge, at?: SewingPoint): boolean {
        // For each outer line of the face edges, check if they are horizontally
        // connected at that position
        return [
            [this.lines[0], other.lines[0]],
            [this.lines[0], other.lines[other.lines.length - 1]],
            [this.lines[this.lines.length - 1], other.lines[0]],
            [this.lines[this.lines.length - 1], other.lines[other.lines.length - 1]],
        ].some(([c1, c2]) => face_edge_component_connected_to_horizontally(
            this.face_carousel.sewingLine.sewing, this, c1, other, c2, at
        ));
    }
}

function face_edge_component_connected_to_horizontally(
    sewing: Sewing,
    edge: FaceEdge,
    component: FaceEdgeComponent,
    other_edge: FaceEdge,
    other: FaceEdgeComponent,
    at?: SewingPoint
): boolean {
    const pos1 = edge.position(component);
    const pos2 = other_edge.position(other);

    if (!at) {
        if (edge == other_edge) {
            return eps_equal(pos1[0], pos2[1], EPS.COARSE) || eps_equal(pos1[1], pos2[0], EPS.COARSE);
        }
    }

    if (component.line == other.line) return false;
    if (!at) return face_edge_component_connected_to_horizontally(
        sewing, edge, component, other_edge, other, sewing.sewing_point(component.line.p1)
    ) || face_edge_component_connected_to_horizontally(
        sewing, edge, component, other_edge, other, sewing.sewing_point(component.line.p2)
    );

    const p1s = at.points.filter((p) => component.line.has_endpoint(p));
    const p2s = at.points.filter((p) => other.line.has_endpoint(p));

    for (const point1 of p1s) {
        for (const point2 of p2s) {
            if (
                component.line.has_endpoint(point1)
                &&
                other.line.has_endpoint(point2)
            ) {
                for (const l1 of point1.get_lines()) {
                    for (const l2 of point2.get_lines()) {
                        if (lines_vertically_adjacent(sewing, l1, l2)) return true;
                    }
                }
            }
        }
    }

    return false;
}

function lines_vertically_adjacent(sewing: Sewing, l1: Line, l2: Line): boolean {
    if (!sewing.has_sewing_line(l1)) return false;
    const sewing_line = sewing.sewing_line(l1);
    if (!sewing.sewing_line(l1).get_lines().includes(l2)) return false;

    const pos1 = sewing_line.position(l1);
    const pos2 = sewing_line.position(l2);
    const i = interval_overlap(pos1, pos2);
    return (i[1] - i[0]) > EPS.COARSE
}