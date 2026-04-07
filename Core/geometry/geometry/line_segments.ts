import { EPS } from "../../numerics";
import { LineSegment } from "../types";
import { Vector } from "../vector";

export function intersect_line_segments(
    l1: LineSegment,
    l2: LineSegment,
): Vector | null {
    const [p, r] = [l1[0], l1[1].subtract(l1[0])];
    const [q, s] = [l2[0], l2[1].subtract(l2[0])];

    const rxs = r.cross(s);
    const qmp = q.subtract(p);
    const t = qmp.cross(s) / rxs;
    const u = qmp.cross(r) / rxs;

    if (rxs === 0) {
        return null;
    }

    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
        const intersection = p.add(r.scale(t));
        return intersection;
    }

    return null;
}

export function closest_vector_on_line_segment(
    endpoints: LineSegment,
    vec: Vector,
): Vector {
    const [vec1, vec2] = endpoints;

    const vec1ToVec = vec.subtract(vec1);
    const vec1ToVec2 = vec2.subtract(vec1);
    const lineSegmentLength = vec1ToVec2.length();

    if (lineSegmentLength < EPS.tiny) {
        return vec1.add(vec2).scale(0.5);
    }

    // Calculate the projection of vec1ToVec onto vec1ToVec2
    const projection =
        vec1ToVec.dot(vec1ToVec2) / (lineSegmentLength * lineSegmentLength);

    if (projection < 0) {
        // Closest to vec1
        return vec1;
    } else if (projection > 1) {
        return vec2;
    } else {
        // Perpendicular distance to the line segment
        const closestPoint = new Vector(
            vec1.x + projection * vec1ToVec2.x,
            vec1.y + projection * vec1ToVec2.y,
        );
        return closestPoint;
    }
}
