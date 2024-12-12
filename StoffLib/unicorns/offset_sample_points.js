/*
    Note this code was written using ChatGPT improving upon the old iteration.
*/

import { line_segments_intersect, vec_angle_clockwise } from '../geometry.js';

const EPSILON = 1e-7;

export default function offset_sample_points(line, radius, direction = 0) {
    if (radius < 0) {
        radius = -radius;
        direction = 1 - direction;
    }

    if (direction === 1) {
        line.swap_orientation();
    }

    const sp = line.get_absolute_sample_points();
    const plen = sp.length;
    const abs_sample_points = [];

    let prev_left = null;
    let left = 0;

    while (left < plen) {
        let right = left + 1;
        while (right < plen && sp[left].distance(sp[right]) < EPSILON) {
            right++;
        }
        if (right >= plen) break;

        if (prev_left === null) {
            const dirVec = sp[right].subtract(sp[left]);
            const orth = dirVec.get_orthogonal().to_len(radius);
            abs_sample_points.push(sp[left].add(orth));
        } else {
            const vec1 = sp[prev_left].subtract(sp[left]);
            const vec2 = sp[right].subtract(sp[left]);
            const angle = vec_angle_clockwise(vec1, vec2, true);
            const center_vec = vec1.rotate(angle / 2).to_len(radius);
            abs_sample_points.push(sp[left].add(center_vec));
        }

        const midpoint = sp[left].add(sp[right]).scale(0.5);
        const edge_orth = sp[right].subtract(sp[left]).get_orthogonal().to_len(radius);
        abs_sample_points.push(midpoint.add(edge_orth));

        prev_left = left;
        left++;
    }

    if (sp[left] && sp[plen - 1].distance(sp[left]) < EPSILON) {
        left = prev_left;
    }

    if (left < plen) {
        const end_orth = sp[plen - 1].subtract(sp[left]).get_orthogonal().to_len(radius);
        abs_sample_points.push(sp[plen - 1].add(end_orth));
    }

    filter_out_cycles(abs_sample_points);

    if (direction === 1) {
        line.swap_orientation();
        abs_sample_points.reverse();
    }

    return abs_sample_points;
}

function filter_out_cycles(abs_sample_points) {
    let i = 0;
    while (i < abs_sample_points.length - 1) {
        const pA = abs_sample_points[i], pB = abs_sample_points[i + 1];
        let foundCycle = false;

        for (let j = i + 2; j < abs_sample_points.length - 1; j++) {
            const pC = abs_sample_points[j], pD = abs_sample_points[j + 1];
            const [intersects, intersectionPoint] = line_segments_intersect([pA, pB], [pC, pD]);

            if (intersects) {
                abs_sample_points.splice(i + 1, j - i);
                abs_sample_points.splice(i + 1, 0, intersectionPoint);
                foundCycle = true;
                break;
            }
        }

        if (!foundCycle) {
            i++;
        }
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
 *
 * 3. Remove loops
 *
 */