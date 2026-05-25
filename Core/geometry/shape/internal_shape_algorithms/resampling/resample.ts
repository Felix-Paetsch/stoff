import { CONF } from "config";
import { Vector } from "Core/geometry/vector";
import { EPS } from "Core/numerics/eps";
import { Polygon } from "../../polygon";
import { Polyline } from "../../polyline";

function is_collinear(a: Vector, b: Vector, c: Vector): boolean {
    const ab = b.subtract(a);
    const bc = c.subtract(b);

    return ab.dot(bc) <= EPS.tiny;
}

export function resample<T extends Polygon | Polyline>(
    s: T,
    sample_spacing: number | null = null,
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
    const res: Vector[] = [vertices[0]!];

    let remaining = sample_spacing;
    let current_left_index = 0;
    let snagged_from_current_segment = 0;

    while (current_left_index < vertices.length - 1) {
        const a = vertices[current_left_index]!;
        const b = vertices[current_left_index + 1]!;
        const d = a.distance(b);

        const remaining_on_segment = d - snagged_from_current_segment;

        if (remaining_on_segment < remaining) {
            current_left_index++;
            remaining -= remaining_on_segment;
            snagged_from_current_segment = 0;
            continue;
        }

        const candidate = Vector.lerp_abs(
            a,
            b,
            snagged_from_current_segment + remaining,
        );

        const last = res[res.length - 1]!;

        if (!last.approx_equals(candidate)) {
            const nextRef = b;

            if (res.length < 2 || !is_collinear(last, candidate, nextRef)) {
                res.push(candidate);
            }
        }

        snagged_from_current_segment += remaining;
        remaining = sample_spacing;
    }

    const end = vertices[vertices.length - 1]!;
    const last = res[res.length - 1]!;

    if (!last.approx_equals(end)) {
        if (res.length >= 2 && is_collinear(res[res.length - 2]!, last, end)) {
            res[res.length - 1] = end;
        } else {
            res.push(end);
        }
    }

    if (s instanceof Polygon) {
        return new Polygon(res) as T;
    }

    return new Polyline(res) as T;
}
