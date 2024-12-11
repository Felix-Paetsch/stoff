import { line_segments_intersect, vec_angle_clockwise } from '../geometry.js';

const EPSILON = 0.0000001;

export default function offset_sample_points(line, radius, direction = 0){
    if (radius < 0){
        radius *= -1;
        direction = 1 - direction;
    }

    if (direction == 1){
        line.swap_orientation();
    }

    const abs_sample_points = [];
    const sp = line.get_absolute_sample_points();

    let prev_left = null; // For angles
    let left = 0;

    while (left < sp.length){
        let right = left + 1;
        while (right < sp.length && sp[left].distance(sp[right]) < EPSILON){
            right++;
        }

        if (right > sp.length - 1){
            break;
        }

        if (prev_left === null){
            // 0.
            const orth = sp[right].subtract(sp[left]).get_orthogonal().to_len(radius);
            abs_sample_points.push(sp[left].add(orth));
        } else {
            // 1a)
            const vec1 = sp[prev_left].subtract(sp[left]);
            const vec2 = sp[right].subtract(sp[left]);
            let angle = vec_angle_clockwise(vec1, vec2, true);
            const center_vec = vec1.rotate(angle/2).to_len(radius);
            abs_sample_points.push(sp[left].add(center_vec));
        }

        // 1b)
        const cp = sp[left].add(sp[right]).scale(0.5);
        const orth = sp[right].subtract(sp[left]).get_orthogonal().to_len(radius);
        abs_sample_points.push(cp.add(orth));

        prev_left = left;
        left++;
    }

    // 2.
    if (sp[left].distance(sp[sp.length - 1]) < EPSILON){
        left = prev_left;
    }
    const orth = sp[sp.length - 1].subtract(sp[left]).get_orthogonal().to_len(radius);
    abs_sample_points.push(sp[sp.length - 1].add(orth));

    // 3.
    filter_out_cycles(abs_sample_points);

    if (direction == 1){
        line.swap_orientation();
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
 *
 * 3. Remove loops
 *
 */

function filter_out_cycles(abs_sample_points) {
    let i = 0;

    while (i < abs_sample_points.length - 1) {
        const currentSegment = [abs_sample_points[i], abs_sample_points[i + 1]];
        let foundCycle = false;

        for (let j = i + 2; j < abs_sample_points.length - 1; j++) {
            const nextSegment = [abs_sample_points[j], abs_sample_points[j + 1]];
            const [intersects, intersectionPoint] = line_segments_intersect(currentSegment, nextSegment);

            if (intersects) {
                // Remove points between the current and the next segment
                abs_sample_points.splice(i + 1, j - i);
                abs_sample_points.splice(i + 1, 0, intersectionPoint);
                foundCycle = true;
                break; // Restart the check from the updated segment
            }
        }

        if (!foundCycle) {
            i++; // Move to the next segment
        }
    }

    return abs_sample_points;
}

/*

================================================================

function filter_out_cycles(abs_sample_points){}

Write this function. Abs sample points is an array of vectors. this array defines a polygon path. I want you to return me a new polygon path which is the old one wiht all cycles removed. Note a cycle usually appears when line segments intersect. I want you to use the following algorithm:

Walk through all line segments (defined by two consecutive points)
For each line segment, consider all the following line segments. If a line segments intersects the current one, remove all points in between, and replace the last point of the current line segment up to the first point of the last line segment with the intersection position. You can use this function:

function line_segments_intersect(l1, l2) {
    const [p, r] = [l1[0], l1[1].subtract(l1[0])];
    const [q, s] = [l2[0], l2[1].subtract(l2[0])];

    const rxs = r.cross(s);
    const qmp = q.subtract(p);
    const t = qmp.cross(s) / rxs;
    const u = qmp.cross(r) / rxs;

    if (rxs === 0) {
        return [false, null];
    }

    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
        const intersection = p.add(r.scale(t));
        return [true, intersection];
    }

    return [false, null];
}

Then start again from the first point of the line segment we looked at.

Explain in text in detail the indexing and your strategy before writing the code.

*/
