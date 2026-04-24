import { EPS } from "@/Core";
import { Polygon, Polyline, Vector } from "../..";
import { CONF } from "../../../../config";

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
    let snagged_from_current_segment = 0;

    while (current_left_index < vertices.length - 1) {
        const d = vertices[current_left_index]!.distance(
            vertices[current_left_index + 1]!,
        );
        if (d < remaining - snagged_from_current_segment) {
            current_left_index++;
            remaining -= d - snagged_from_current_segment;
            snagged_from_current_segment = 0;
            continue;
        }

        res.push(
            Vector.lerp_abs(
                vertices[current_left_index]!,
                vertices[current_left_index + 1]!,
                snagged_from_current_segment + remaining,
            ),
        );

        snagged_from_current_segment += remaining;
        remaining = sample_spacing;
    }

    res.push(vertices[vertices.length - 1]!);
    if (s instanceof Polygon) {
        return new Polygon(res) as T;
    }

    return new Polyline(res) as T;
}
