import {
    line_segments_intersect,
    vec_angle_clockwise,
    EPS,
} from "../geometry.js";

export default function offset_sample_points(
    sample_points,
    radius,
    toRight = true
) {
    if (radius < 0) {
        radius *= -1;
        toRight = !toRight;
    }

    if (!toRight) {
        sample_points.reverse();
    }

    const abs_sample_points = [];

    let prev_left = null; // For angles
    let left = 0;

    while (left < sample_points.length) {
        let right = left + 1;
        while (
            right < sample_points.length &&
            sample_points[left].equals(sample_points[right], EPS.FINE)
        ) {
            right++;
        }

        if (right > sample_points.length - 1) {
            break;
        }

        if (prev_left === null) {
            // 0.
            const orth = sample_points[right]
                .subtract(sample_points[left])
                .get_orthogonal()
                .to_len(radius);
            abs_sample_points.push(sample_points[left].add(orth));
        } else {
            // 1a)
            const vec1 = sample_points[prev_left].subtract(sample_points[left]);
            const vec2 = sample_points[right].subtract(sample_points[left]);
            let angle = vec_angle_clockwise(vec1, vec2, true);
            const center_vec = vec1.rotate(angle / 2).to_len(radius);
            abs_sample_points.push(sample_points[left].add(center_vec));
        }

        // 1b)
        const cp = sample_points[left].add(sample_points[right]).scale(0.5);
        const orth = sample_points[right]
            .subtract(sample_points[left])
            .get_orthogonal()
            .to_len(radius);
        abs_sample_points.push(cp.add(orth));

        prev_left = left;
        left = right;
    }

    // 2.
    if (
        sample_points[left].equals(
            sample_points[sample_points.length - 1],
            EPS.FINE
        )
    ) {
        left = prev_left;
    }
    const orth = sample_points[sample_points.length - 1]
        .subtract(sample_points[left])
        .get_orthogonal()
        .to_len(radius);
    abs_sample_points.push(sample_points[sample_points.length - 1].add(orth));

    // 3.
    remove_spikes(abs_sample_points, sp);

    // 4.
    filter_out_cycles(abs_sample_points);

    if (!toRight) {
        sample_points.reverse();
        abs_sample_points.reverse();
    }

    return abs_sample_points;
}

/**
 *
 * 0. Add Very first Point
 * 1. Loop through all lines and add offset vectors to sample points
 * - Line for first point
 * - Line for middle
 * 2. Add Very last point
 * 3. Remove Spikes at the end
 * 4. Remove loops
 *
 */

function filter_out_cycles(abs_sample_points) {
    let i = 0;
    outer: while (i < abs_sample_points.length - 1) {
        const currentSegment = [abs_sample_points[i], abs_sample_points[i + 1]];

        for (let j = i + 2; j < abs_sample_points.length - 1; j++) {
            const nextSegment = [
                abs_sample_points[j],
                abs_sample_points[j + 1],
            ];
            const [intersects, intersectionPoint] = line_segments_intersect(
                currentSegment,
                nextSegment
            );

            if (intersects) {
                abs_sample_points.splice(i + 1, j - i, intersectionPoint);
                i = Math.max(0, i - 1);
                continue outer;
            }
        }

        i++;
    }

    return abs_sample_points;
}

function remove_spikes(abs_sample_points, sp) {
    // End side
    let may_have_spike = true;
    while (may_have_spike && abs_sample_points.length > 2) {
        may_have_spike = false;
        const endSeg = [
            abs_sample_points[abs_sample_points.length - 1],
            sp[sp.length - 1],
        ];
        for (let i = 0; i < abs_sample_points.length - 2; i++) {
            const seg = [abs_sample_points[i], abs_sample_points[i + 1]];
            const [intersects] = line_segments_intersect(endSeg, seg);
            if (intersects) {
                abs_sample_points.pop();
                may_have_spike = true;
                break;
            }
        }
    }

    // Start side
    may_have_spike = true;
    while (may_have_spike && abs_sample_points.length > 2) {
        may_have_spike = false;
        const startSeg = [abs_sample_points[0], sp[0]];
        for (let i = 1; i < abs_sample_points.length - 1; i++) {
            const seg = [abs_sample_points[i], abs_sample_points[i + 1]];
            const [intersects] = line_segments_intersect(startSeg, seg);
            if (intersects) {
                abs_sample_points.shift();
                may_have_spike = true;
                break;
            }
        }
    }
}
