import { assert } from "@/Core/assert";
import CONF from "../config.json" with { type: "json" };
import { EPS, Vector, ZERO } from "../geometry";
import { Line } from "../line";

export function rel_normalized_sample_points(line: Line, approx_sample_spacing: number | null = null) {
    if (approx_sample_spacing == null) {
        const density = CONF.DEFAULT_SAMPLE_POINT_DENSITY;
        approx_sample_spacing = line.get_length() / (density * line.endpoint_distance());
    }
    approx_sample_spacing = Math.round(approx_sample_spacing);

    const total_len = line.get_length() / line.endpoint_distance();
    const step_size = 1 / approx_sample_spacing;
    const sample_point_distance = total_len * step_size;

    const sp = line.sample_points;
    const res = [sp[0]];

    let current_sp_index = 0;
    let point_for_distance_from = sp[0]; // Is or is after sp[current_sp_index]
    let distance_left = sample_point_distance;

    while (current_sp_index < sp.length - 1) {
        let distance_to_next_sp_point = point_for_distance_from
            .subtract(sp[current_sp_index + 1])
            .length();
        if (distance_to_next_sp_point < distance_left) {
            distance_left -= distance_to_next_sp_point;
            current_sp_index += 1;
            point_for_distance_from = sp[current_sp_index];
        } else {
            const next_sample_point = point_for_distance_from.add(
                sp[current_sp_index + 1]
                    .subtract(point_for_distance_from)
                    .normalize()
                    .mult(distance_left)
            );

            point_for_distance_from = next_sample_point;
            res.push(next_sample_point);
            distance_left = sample_point_distance;
        }
    }

    if (
        sp[sp.length - 1].subtract(res[res.length - 1]).length() <
        sample_point_distance * 0.3
    ) {
        res.pop();
    }

    res.push(sp[sp.length - 1]);

    return res;
};

export function abs_normalized_sample_points(line: Line, approx_sample_spacing: number | null = null) {
    const to_abs = line.get_to_absolute_function();
    return line._rel_normalized_sample_points(
        approx_sample_spacing ? approx_sample_spacing / line.endpoint_distance() : null
    ).map(to_abs);
};

export function remove_duplicate_points(line: Line) {
    if (line.sample_points.length <= 2) return;

    let last_index = 0;
    line.sample_points = line.sample_points.filter((point, index) => {
        if (index === 0) return true;
        const prevPoint = line.sample_points[last_index];
        if (prevPoint.distance(point) > EPS.WEAK_EQUAL) {
            last_index = index;
            return true;
        }
        return false;
    });
}

export function renormalize(line: Line, new_density: number | null = null) {
    if (!new_density) new_density = CONF.DEFAULT_SAMPLE_POINT_DENSITY;

    const n = line.get_length() / new_density!;
    line.sample_points = line._rel_normalized_sample_points(n);
    return line;
};

export function smooth_out(
    line: Line,
    ker_size: number = 0.1,
    ker_size_absolute: boolean = false
) {
    if (ker_size_absolute) {
        ker_size = ker_size / line.endpoint_distance();
    }

    const density = CONF.DEFAULT_SAMPLE_POINT_DENSITY;
    line.sample_points = line._rel_normalized_sample_points(
        line.get_length() / density
    );

    const pts = line.sample_points;
    if (pts.length <= 2) return line;

    // Arc-length parameterization
    const arc: number[] = [0];
    for (let i = 1; i < pts.length; i++) {
        arc[i] = arc[i - 1] + pts[i - 1].distance(pts[i]);
    }

    const L = arc[arc.length - 1];
    const k = ker_size;

    // Weighted centroid over segments
    function centroid(points: Vector[], weights: number[]): Vector {
        let acc = ZERO;
        let total = 0;

        for (let i = 0; i < weights.length; i++) {
            const w = weights[i];
            if (w <= 0) continue;

            acc = acc.add(
                points[i].add(points[i + 1]).scale(0.5 * w)
            );
            total += w;
        }

        return total > 0 ? acc.scale(1 / total) : points[0];
    }

    const new_points: Vector[] = [];
    new_points.push(pts[0]); // fixed endpoint

    for (let i = 1; i < pts.length - 1; i++) {
        const s = arc[i];
        const w0 = s - k;
        const w1 = s + k;

        const points: Vector[] = [];
        const weights: number[] = [];

        // Left collapsed mass
        if (w0 < 0) {
            const w = -w0;
            points.push(pts[0], pts[0]);
            weights.push(w);
        }

        // Interior segments
        for (let j = 0; j < pts.length - 1; j++) {
            const a0 = arc[j];
            const a1 = arc[j + 1];
            const seg_len = a1 - a0;

            if (seg_len <= EPS.WEAK_EQUAL) continue;
            if (a1 < w0 || a0 > w1) continue;

            const t0 = Math.max(0, (w0 - a0) / seg_len);
            const t1 = Math.min(1, (w1 - a0) / seg_len);
            if (t0 >= t1) continue;

            const p0 = pts[j].scale(1 - t0).add(pts[j + 1].scale(t0));
            const p1 = pts[j].scale(1 - t1).add(pts[j + 1].scale(t1));
            const w = (t1 - t0) * seg_len;

            if (points.length === 0) points.push(p0);
            points.push(p1);
            weights.push(w);
        }

        // Right collapsed mass
        if (w1 > L) {
            const w = w1 - L;
            const last = pts[pts.length - 1];
            if (points.length === 0) {
                points.push(last);
            }
            points.push(last);
            weights.push(w);
        }

        new_points.push(
            weights.length > 0 ? centroid(points, weights) : pts[i]
        );
    }

    new_points.push(pts[pts.length - 1]); // fixed endpoint

    line.sample_points = new_points;
    return line;
}

export function compute_polyline_center_point(
    points: Vector[]
) {
    assert(points.length > 0, "No points give");
    if (points.length == 1) return points[1];

    let result = ZERO;
    let len = 0;

    for (let i = 0; i < points.length - 1; i++) {
        const distance = points[i].distance(points[i + 1]);
        len += distance;

        result = result.add(
            points[i].add(points[i + 1]).scale(distance)
        );
    }

    return result.scale(1 / (2 * len));
}

