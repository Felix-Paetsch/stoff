import { EPS, Vector, ZERO } from "@/Core/geometry";
import { PolygonVectors, PolylineVectors } from "@/Core/geometry/shapes";
import CONF from "../config.json" with { type: "json" };

export function polyline_smooth_out(
    line: PolylineVectors,
    ker_size: number = 0.1,
    sample_spacing: number | null = null,
): PolylineVectors {
    const step = sample_spacing ?? CONF.DEFAULT_LINE_SEGMENT_LENGTH;

    if (line.length === 0) return [];
    if (line.length === 1) return [line[0]!];

    const pts = line;

    // build arc-lengths
    const arc: number[] = [0];
    for (let i = 0; i < pts.length - 1; i++) {
        arc.push(arc[i]! + pts[i]!.distance(pts[i + 1]!));
    }

    const L = arc[arc.length - 1]!;
    if (L <= EPS.COARSE) return [pts[0]!, pts[pts.length - 1]!];

    const sample_count = Math.max(1, Math.ceil(L / step));
    const out: PolylineVectors = [];

    let seg_i = 0;

    for (let k = 0; k <= sample_count; k++) {
        const s = k === sample_count ? L : k * step;

        // fix endpoints exactly
        if (k === 0) {
            out.push(pts[0]!);
            continue;
        }
        if (k === sample_count) {
            out.push(pts[pts.length - 1]!);
            continue;
        }

        const w0 = s - ker_size;
        const w1 = s + ker_size;

        let acc = ZERO;
        let total_w = 0;

        // left spill → first point
        if (w0 < 0) {
            const w = -w0;
            acc = acc.add(pts[0]!.scale(w));
            total_w += w;
        }

        // advance segment pointer (monotonic in s)
        while (seg_i < arc.length - 2 && arc[seg_i + 1]! < w0) {
            seg_i++;
        }

        // iterate segments overlapping window
        for (let j = seg_i; j < pts.length - 1; j++) {
            const a0 = arc[j]!;
            const a1 = arc[j + 1]!;

            if (a0 > w1) break;
            if (a1 < w0) continue;

            const len = a1 - a0;
            if (len <= EPS.TINY) continue;

            const t0 = Math.max(0, (w0 - a0) / len);
            const t1 = Math.min(1, (w1 - a0) / len);
            if (t1 <= t0) continue;

            const p0 = Vector.lerp(pts[j]!, pts[j + 1]!, t0);
            const p1 = Vector.lerp(pts[j]!, pts[j + 1]!, t1);

            const w = (t1 - t0) * len;

            // average of segment piece = midpoint
            const mid = p0.add(p1).scale(0.5);

            acc = acc.add(mid.scale(w));
            total_w += w;
        }

        // right spill → last point
        if (w1 > L) {
            const w = w1 - L;
            acc = acc.add(pts[pts.length - 1]!.scale(w));
            total_w += w;
        }

        out.push(total_w > EPS.TINY ? acc.scale(1 / total_w) : pts[seg_i]!);
    }

    return out;
}

export function polygon_smooth_out(
    line: PolygonVectors,
    ker_size: number = 0.1,
    sample_spacing: number | null = null,
): PolygonVectors {
    const step = sample_spacing ?? CONF.DEFAULT_LINE_SEGMENT_LENGTH;

    if (line.length === 0) return [];
    if (line.length === 1) return [line[0]!];

    const pts = line;
    const n = pts.length;

    // build arc-lengths INCLUDING closing segment
    const arc: number[] = [0];
    for (let i = 0; i < n; i++) {
        const a = pts[i]!;
        const b = pts[(i + 1) % n]!;
        arc.push(arc[i]! + a.distance(b));
    }

    const L = arc[arc.length - 1]!;
    if (L <= EPS.COARSE) return [...pts];

    const sample_count = Math.max(1, Math.ceil(L / step));
    const out: PolylineVectors = [];

    const wrap = (s: number) => {
        s %= L;
        return s < 0 ? s + L : s;
    };

    for (let k = 0; k < sample_count; k++) {
        const s = wrap(k * step);

        const w0 = s - ker_size;
        const w1 = s + ker_size;
        const window_len = w1 - w0;

        let acc = ZERO;
        let total_w = 0;

        // ---- FULL WRAPS ----
        if (window_len >= L) {
            const full_wraps = Math.floor(window_len / L);

            if (full_wraps > 0) {
                let full_acc = ZERO;

                for (let j = 0; j < n; j++) {
                    const a = pts[j]!;
                    const b = pts[(j + 1) % n]!;
                    const len = a.distance(b);
                    if (len <= EPS.TINY) continue;

                    const mid = a.add(b).scale(0.5);
                    full_acc = full_acc.add(mid.scale(len));
                }

                acc = acc.add(full_acc.scale(full_wraps));
                total_w += L * full_wraps;
            }
        }

        // ---- REMAINDER WINDOW ----
        const rem_len = window_len % L;

        if (rem_len > EPS.TINY) {
            const base = w1 - rem_len;
            const a0 = wrap(base);
            const a1 = wrap(base + rem_len);

            const intervals: [number, number][] =
                a0 <= a1
                    ? [[a0, a1]]
                    : [
                          [a0, L],
                          [0, a1],
                      ];

            for (const [ia, ib] of intervals) {
                for (let j = 0; j < n; j++) {
                    const seg_a0 = arc[j]!;
                    const seg_a1 = arc[j + 1]!;

                    if (seg_a0 > ib) break;
                    if (seg_a1 < ia) continue;

                    const len = seg_a1 - seg_a0;
                    if (len <= EPS.TINY) continue;

                    const t0 = Math.max(0, (ia - seg_a0) / len);
                    const t1 = Math.min(1, (ib - seg_a0) / len);
                    if (t1 <= t0) continue;

                    const pA = pts[j % n]!;
                    const pB = pts[(j + 1) % n]!;

                    const p0 = Vector.lerp(pA, pB, t0);
                    const p1 = Vector.lerp(pA, pB, t1);

                    const w = (t1 - t0) * len;
                    const mid = p0.add(p1).scale(0.5);

                    acc = acc.add(mid.scale(w));
                    total_w += w;
                }
            }
        }

        out.push(total_w > EPS.TINY ? acc.scale(1 / total_w) : pts[0]!);
    }

    return out;
}

export function compute_polyline_center_point(points: Vector[]): Vector {
    if (points.length === 0) return ZERO;
    if (points.length === 1) return points[0]!;

    let acc = ZERO;
    let len = 0;

    for (let i = 0; i < points.length - 1; i++) {
        const d = points[i]!.distance(points[i + 1]!);
        len += d;
        acc = acc.add(points[i]!.add(points[i + 1]!).scale(d));
    }

    return len > EPS.TINY ? acc.scale(1 / (2 * len)) : points[0]!;
}
