import { CONF } from "../../../../config";
import { Radians, Shape, Spline, Vector } from "../..";
import { EPS } from "@/Core/numerics";

function find_previous_distinct_point(
    line: Vector[],
    fromIndex: number,
    anchor: Vector,
): Vector | null {
    for (let i = fromIndex; i >= 0; i -= 1) {
        const candidate = line[i]!;
        if (candidate.distance(anchor) > EPS.tiny) {
            return candidate;
        }
    }
    return null;
}

function find_next_distinct_point(
    line: Vector[],
    fromIndex: number,
    anchor: Vector,
): Vector | null {
    for (let i = fromIndex; i < line.length; i += 1) {
        const candidate = line[i]!;
        if (candidate.distance(anchor) > EPS.tiny) {
            return candidate;
        }
    }
    return null;
}

function normalize_polygon_points(line: Vector[]): Vector[] {
    if (line.length <= 1) {
        return [...line];
    }

    const first = line[0]!;
    const last = line[line.length - 1]!;

    if (first.distance(last) <= EPS.tiny) {
        return line.slice(0, -1);
    }

    return [...line];
}

function find_previous_distinct_point_wrapped(
    line: Vector[],
    anchorIndex: number,
): Vector | null {
    const n = line.length;
    const anchor = line[anchorIndex]!;

    for (let step = 1; step < n; step += 1) {
        const i = (anchorIndex - step + n) % n;
        const candidate = line[i]!;
        if (candidate.distance(anchor) > EPS.tiny) {
            return candidate;
        }
    }

    return null;
}

function find_next_distinct_point_wrapped(
    line: Vector[],
    anchorIndex: number,
): Vector | null {
    const n = line.length;
    const anchor = line[anchorIndex]!;

    for (let step = 1; step < n; step += 1) {
        const i = (anchorIndex + step) % n;
        const candidate = line[i]!;
        if (candidate.distance(anchor) > EPS.tiny) {
            return candidate;
        }
    }

    return null;
}

function spline_for_line_segment(
    line: Vector[],
    leftIndex: number,
    smoothness_angle: number,
): Shape.PolylineFunction {
    const p1 = line[leftIndex]!;
    const p2 = line[leftIndex + 1]!;

    const p0 = find_previous_distinct_point(line, leftIndex - 1, p1);
    const p3 = find_next_distinct_point(line, leftIndex + 2, p2);

    let leftTangentPoint = p0;
    let rightTangentPoint = p3;

    if (
        leftTangentPoint &&
        Vector.angle(leftTangentPoint, p2, p1) < smoothness_angle
    ) {
        leftTangentPoint = null;
    }
    if (
        rightTangentPoint &&
        Vector.angle(p1, rightTangentPoint, p2) < smoothness_angle
    ) {
        rightTangentPoint = null;
    }

    if (leftTangentPoint == null && rightTangentPoint == null) {
        return (x) => Vector.lerp(p1, p2, x);
    }

    const segment = p2.subtract(p1);
    const t1 = leftTangentPoint ? p1.subtract(leftTangentPoint) : segment;
    const t2 = rightTangentPoint ? rightTangentPoint.subtract(p2) : segment;

    return Spline.hermite([p1, p2], [t1, t2], true);
}

function spline_for_polygon_segment(
    line: Vector[],
    leftIndex: number,
    smoothness_angle: number,
): Shape.PolylineFunction {
    const n = line.length;
    const p1 = line[leftIndex]!;
    const p2 = line[(leftIndex + 1) % n]!;

    const p0 = find_previous_distinct_point_wrapped(line, leftIndex);
    const p3 = find_next_distinct_point_wrapped(line, (leftIndex + 1) % n);

    let leftTangentPoint = p0;
    let rightTangentPoint = p3;

    if (
        leftTangentPoint &&
        Vector.angle(leftTangentPoint, p2, p1) < smoothness_angle
    ) {
        leftTangentPoint = null;
    }
    if (
        rightTangentPoint &&
        Vector.angle(p1, rightTangentPoint, p2) < smoothness_angle
    ) {
        rightTangentPoint = null;
    }

    if (leftTangentPoint == null && rightTangentPoint == null) {
        return (x) => Vector.lerp(p1, p2, x);
    }

    const segment = p2.subtract(p1);
    const t1 = leftTangentPoint ? p1.subtract(leftTangentPoint) : segment;
    const t2 = rightTangentPoint ? rightTangentPoint.subtract(p2) : segment;

    return Spline.hermite([p1, p2], [t1, t2], true);
}

export function resample_line_points(
    line: Vector[],
    smoothness_angle: Radians = Math.PI * 1.2, // Low angle leads to smoothing even around sharper corners
    sample_spacing: number | null = null,
): Vector[] {
    if (line.length === 0) {
        return [];
    }

    if (line.length === 1) {
        return [line[0]!];
    }

    if (sample_spacing == null) {
        sample_spacing = CONF.DEFAULT_LINE_SEGMENT_LENGTH;
    }

    if (sample_spacing <= EPS.tiny) {
        return [...line];
    }

    const res: Vector[] = [line[0]!];

    let current_left_index = 0;
    let distance_to_next_res_pt = sample_spacing;
    let distance_to_next_sample_pt = line[1]!.distance(line[0]!);
    let current_spline: Shape.PolylineFunction | null = null;

    while (true) {
        if (distance_to_next_sample_pt <= EPS.tiny) {
            current_left_index += 1;
            if (current_left_index >= line.length - 1) {
                break;
            }

            distance_to_next_sample_pt = line[current_left_index]!.distance(
                line[current_left_index + 1]!,
            );
            current_spline = null;
            continue;
        }

        if (distance_to_next_sample_pt < distance_to_next_res_pt) {
            distance_to_next_res_pt -= distance_to_next_sample_pt;

            current_left_index += 1;
            if (current_left_index >= line.length - 1) {
                break;
            }

            const curr = line[current_left_index]!;
            const prev = line[current_left_index - 1]!;
            const next = line[current_left_index + 1]!;

            if (
                curr.distance(prev) > EPS.tiny &&
                curr.distance(next) > EPS.tiny &&
                Vector.angle(prev, next, curr) < smoothness_angle
            ) {
                res.push(curr);
            }

            distance_to_next_sample_pt = line[current_left_index]!.distance(
                line[current_left_index + 1]!,
            );
            current_spline = null;
            continue;
        }

        if (!current_spline) {
            current_spline = spline_for_line_segment(
                line,
                current_left_index,
                smoothness_angle,
            );
        }

        const traveled_on_current_segment = distance_to_next_res_pt;
        const total_line_segment_length = line[current_left_index]!.distance(
            line[current_left_index + 1]!,
        );

        const fraction =
            traveled_on_current_segment / total_line_segment_length;
        res.push(current_spline(fraction));

        distance_to_next_sample_pt -= traveled_on_current_segment;
        distance_to_next_res_pt = sample_spacing;
    }

    const last = line[line.length - 1]!;
    if (res[res.length - 1]!.distance(last) > EPS.tiny) {
        res.push(last);
    }

    return res;
}

export function resample_polygon_points(
    line: Vector[],
    smoothness_angle: Radians = Math.PI * 1.2,
    sample_spacing: number | null = null,
): Vector[] {
    const polygon = normalize_polygon_points(line);

    if (polygon.length === 0) {
        return [];
    }

    if (polygon.length === 1) {
        return [polygon[0]!];
    }

    if (sample_spacing == null) {
        sample_spacing = CONF.DEFAULT_LINE_SEGMENT_LENGTH;
    }

    if (sample_spacing <= EPS.tiny) {
        return [...polygon];
    }

    const n = polygon.length;
    const res: Vector[] = [polygon[0]!];

    let current_left_index = 0;
    let distance_to_next_res_pt = sample_spacing;
    let distance_to_next_sample_pt = polygon[1]!.distance(polygon[0]!);
    let current_spline: Shape.PolylineFunction | null = null;
    let traversedSegments = 0;

    while (traversedSegments < n) {
        if (distance_to_next_sample_pt <= EPS.tiny) {
            current_left_index = (current_left_index + 1) % n;
            traversedSegments += 1;

            if (traversedSegments >= n) {
                break;
            }

            distance_to_next_sample_pt = polygon[current_left_index]!.distance(
                polygon[(current_left_index + 1) % n]!,
            );
            current_spline = null;
            continue;
        }

        if (distance_to_next_sample_pt < distance_to_next_res_pt) {
            distance_to_next_res_pt -= distance_to_next_sample_pt;

            current_left_index = (current_left_index + 1) % n;
            traversedSegments += 1;

            if (traversedSegments >= n) {
                break;
            }

            const curr = polygon[current_left_index]!;
            const prev = polygon[(current_left_index - 1 + n) % n]!;
            const next = polygon[(current_left_index + 1) % n]!;

            if (
                curr.distance(prev) > EPS.tiny &&
                curr.distance(next) > EPS.tiny &&
                Vector.angle(prev, next, curr) < smoothness_angle
            ) {
                if (res[res.length - 1]!.distance(curr) > EPS.tiny) {
                    res.push(curr);
                }
            }

            distance_to_next_sample_pt = polygon[current_left_index]!.distance(
                polygon[(current_left_index + 1) % n]!,
            );
            current_spline = null;
            continue;
        }

        if (!current_spline) {
            current_spline = spline_for_polygon_segment(
                polygon,
                current_left_index,
                smoothness_angle,
            );
        }

        const traveled_on_current_segment = distance_to_next_res_pt;
        const total_line_segment_length = polygon[current_left_index]!.distance(
            polygon[(current_left_index + 1) % n]!,
        );

        const fraction =
            traveled_on_current_segment / total_line_segment_length;
        const sample = current_spline(fraction);

        if (res[res.length - 1]!.distance(sample) > EPS.tiny) {
            res.push(sample);
        }

        distance_to_next_sample_pt -= traveled_on_current_segment;
        distance_to_next_res_pt = sample_spacing;
    }

    if (res.length > 1 && res[res.length - 1]!.distance(res[0]!) <= EPS.tiny) {
        res.pop();
    }

    return res;
}
