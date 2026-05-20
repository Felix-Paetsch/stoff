import { EPS } from "Core/numerics/eps";
import { Polygon, Polyline, Shape, Vector } from "../..";

export function simplify<T extends Shape.Shape>(poly: T): T {
    return simplify_with_eps(poly, EPS.tiny);
}

export function simplify_with_eps<T extends Shape.Shape>(
    poly: T,
    eps: number,
): T {
    if (poly.is_empty()) return poly;

    const result: Vector[] = [];
    _simplify_with_eps(result, poly.as_polyline().vertices, eps);

    if (poly instanceof Polyline) {
        return new Polyline(result) as T;
    }
    return new Polygon(result) as T;
}

function _simplify_with_eps(
    result: Vector[],
    poly: Vector[],
    eps: number,
): void {
    if (poly.length === 0) {
        return;
    }

    // Ramer-Douglas-Peucker doesn't work with closed paths, thus simplify
    // the open path and then close it manually.
    if (is_closed(poly)) {
        rdp(result, poly.slice(0, -1), eps);
        result.push(poly[poly.length - 1]!);
    } else {
        rdp(result, poly, eps);
    }
}

/**
 * Implementation of the Ramer-Douglas-Peucker algorithm to simplify an open path.
 */
function rdp(result: Vector[], poly: Vector[], eps: number): void {
    if (poly.length < 3) {
        result.push(...poly);
        return;
    }

    const sp = poly[0]!;
    const ep = poly[poly.length - 1]!;

    let farthestIndex = 0;
    let maxDist = Number.NEGATIVE_INFINITY;

    for (let i = 1; i < poly.length - 1; i += 1) {
        const p = poly[i]!;
        const d = perpendicular_dist(p, sp, ep);

        if (d > maxDist) {
            maxDist = d;
            farthestIndex = i;
        }
    }

    if (maxDist > eps) {
        rdp(result, poly.slice(0, farthestIndex + 1), eps);

        // Remove point with max dist; it will be added with the right side.
        result.pop();

        _simplify_with_eps(result, poly.slice(farthestIndex), eps);
    } else {
        result.push(sp);
        result.push(ep);
    }
}

function perpendicular_dist(p: Vector, s: Vector, e: Vector): number {
    const dx = e.x - s.x;
    const dy = e.y - s.y;
    const den = Math.sqrt(dx * dx + dy * dy);

    if (den <= EPS.tiny) {
        return p.distance(s);
    }

    const num = Math.abs(dy * p.x - dx * p.y + e.x * s.y - e.y * s.x);
    return num / den;
}

function is_closed(poly: Vector[]): boolean {
    if (poly.length < 2) {
        return false;
    }

    return poly[0]!.distance(poly[poly.length - 1]!) <= EPS.tiny;
}
