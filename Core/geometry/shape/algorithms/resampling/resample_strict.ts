import { CONF } from "config";
import { Vector } from "Core/geometry/vector";
import { EPS } from "Core/numerics/eps";
import { Polygon } from "../../polygon";
import { Polyline } from "../../polyline";

export function resample_strict<T extends Polygon | Polyline>(
    s: T,
    sample_spacing: number | null = null,
): T {
    if (sample_spacing == null) {
        sample_spacing = CONF.DEFAULT_LINE_SEGMENT_LENGTH;
    }

    if (sample_spacing <= EPS.tiny) {
        return s;
    }

    if (s.vertex_count < 2) {
        return s;
    }

    const vertices = s.as_polyline().vertices;
    const res: Vector[] = [vertices[0]!];

    let remaining = sample_spacing;
    let current_left_index = 0;
    let consumed_on_segment = 0;

    while (current_left_index < vertices.length - 1) {
        const a = vertices[current_left_index]!;
        const b = vertices[current_left_index + 1]!;
        const d = a.distance(b);

        if (d <= EPS.tiny) {
            current_left_index++;
            consumed_on_segment = 0;
            continue;
        }

        const remaining_on_segment = d - consumed_on_segment;

        if (remaining_on_segment + EPS.tiny < remaining) {
            current_left_index++;
            remaining -= remaining_on_segment;
            consumed_on_segment = 0;
            continue;
        }

        const candidate = Vector.lerp_abs(
            a,
            b,
            consumed_on_segment + remaining,
        );

        const last = res[res.length - 1]!;

        if (!last.approx_equals(candidate)) {
            res.push(candidate);
        }

        consumed_on_segment += remaining;
        remaining = sample_spacing;

        if (d - consumed_on_segment <= EPS.tiny) {
            current_left_index++;
            consumed_on_segment = 0;
        }
    }

    const end = vertices[vertices.length - 1]!;
    const last = res[res.length - 1]!;

    if (!last.approx_equals(end)) {
        res.push(end);
    }

    if (s instanceof Polygon) {
        return new Polygon(res) as T;
    }

    return new Polyline(res) as T;
}
