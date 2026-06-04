import { CONF } from "Core/config";
import { Vector } from "Core/geometry/vector";
import { EPS } from "Core/numerics/eps";
import { Polygon } from "../../polygon";
import { Polyline } from "../../polyline";

export function resample_strict<T extends Polygon | Polyline>(
    s: T,
    sample_spacing: number | null = null,
    smoothness_angle: number = Math.PI,
): T {
    if (sample_spacing == null) {
        sample_spacing = CONF.DEFAULT_LINE_SEGMENT_LENGTH;
    }

    if (sample_spacing <= EPS.tiny) {
        return s;
    }

    if (s.vertex_count() < 2) {
        return s;
    }

    const vertices = s.as_polyline().vertices;
    const lastIndex = vertices.length - 1;

    if (lastIndex < 1) {
        return s;
    }

    const res: Vector[] = [];
    const cornerIndices: number[] = [0];

    // Find corners: interior vertices where the absolute turning angle
    // between consecutive segments exceeds smoothness_angle.
    for (let i = 1; i < lastIndex; i++) {
        const prev = vertices[i - 1]!;
        const curr = vertices[i]!;
        const next = vertices[i + 1]!;

        const v1 = curr.subtract(prev);
        const v2 = next.subtract(curr);

        if (
            v1.length_squared() <= EPS.tiny ||
            v2.length_squared() <= EPS.tiny
        ) {
            continue;
        }

        let angle = Vector.angle_clockwise(v1, v2, "minusPiToPi");
        angle = Math.abs(angle);

        if (angle > smoothness_angle) {
            cornerIndices.push(i);
        }
    }

    cornerIndices.push(lastIndex);

    // Resample each corner-to-corner chunk independently.
    // Each chunk keeps both endpoints, and intermediate samples are spaced
    // evenly with spacing <= sample_spacing.
    for (let cornerIdx = 0; cornerIdx < cornerIndices.length - 1; cornerIdx++) {
        const startIndex = cornerIndices[cornerIdx]!;
        const endIndex = cornerIndices[cornerIdx + 1]!;

        // Compute total arc length of this chunk.
        let totalLength = 0;
        for (let i = startIndex; i < endIndex; i++) {
            totalLength += vertices[i]!.distance(vertices[i + 1]!);
        }

        if (res.length === 0) {
            res.push(vertices[startIndex]!);
        } else {
            const last = res[res.length - 1]!;
            if (!last.approx_equals(vertices[startIndex]!)) {
                res.push(vertices[startIndex]!);
            }
        }

        if (totalLength <= EPS.tiny) {
            const end = vertices[endIndex]!;
            const last = res[res.length - 1]!;
            if (!last.approx_equals(end)) {
                res.push(end);
            }
            continue;
        }

        // Number of subsegments so that spacing is <= sample_spacing.
        const segmentCount = Math.max(
            1,
            Math.ceil(totalLength / sample_spacing),
        );
        const actualSpacing = totalLength / segmentCount;

        let targetDist = actualSpacing;
        let accumulatedBeforeSegment = 0;

        for (
            let i = startIndex;
            i < endIndex && targetDist < totalLength - EPS.tiny;
            i++
        ) {
            const a = vertices[i]!;
            const b = vertices[i + 1]!;
            const segLen = a.distance(b);

            if (segLen <= EPS.tiny) {
                continue;
            }

            const segmentEndDist = accumulatedBeforeSegment + segLen;

            while (targetDist < segmentEndDist + EPS.tiny) {
                if (targetDist >= totalLength - EPS.tiny) {
                    break;
                }

                const localDist = targetDist - accumulatedBeforeSegment;
                const candidate = Vector.lerp_abs(a, b, localDist);
                const last = res[res.length - 1]!;

                if (!last.approx_equals(candidate)) {
                    res.push(candidate);
                }

                targetDist += actualSpacing;
            }

            accumulatedBeforeSegment = segmentEndDist;
        }

        const end = vertices[endIndex]!;
        const last = res[res.length - 1]!;
        if (!last.approx_equals(end)) {
            res.push(end);
        }
    }

    if (s instanceof Polygon) {
        return new Polygon(res) as T;
    }

    return new Polyline(res) as T;
}
