import { EPS } from "@/Core";
import { CONF } from "config";
import { Polygon, Polyline, Vector } from "../..";

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

    const l = s.length();
    const verticies = s.as_polyline().verticies;

    const segment_length = l / sample_spacing;

    const res: Vector[] = [verticies[0]!];
    let remaining = segment_length;
    let current_left_index = 0;
    let snagged_from_current_segment = 0;

    while (current_left_index < verticies.length - 1) {
        const d = res[current_left_index]!.distance(
            res[current_left_index + 1]!,
        );
        if (d < remaining - snagged_from_current_segment) {
            current_left_index++;
            remaining -= d - snagged_from_current_segment;
            snagged_from_current_segment = 0;
            continue;
        }

        res.push(
            Vector.lerp_abs(
                res[current_left_index]!,
                res[current_left_index + 1]!,
                snagged_from_current_segment + remaining,
            ),
        );

        snagged_from_current_segment += remaining;
        remaining = segment_length;
    }

    res.push(verticies[verticies.length - 1]!);
    if (s instanceof Polygon) {
        return new Polygon(res) as T;
    }

    return new Polyline(res) as T;
}
