import { Vector } from '../geometry.js';
import { Point } from "../point";
import { Line } from "../line";
import { Sketch } from '../sketch';

export function line_with_length(
    original_sk: Sketch,
    original_p1: Point,
    original_p2: Point,
    length: number
): Line {
    const sk = new Sketch();
    const p1 = sk.add_point(new Vector(0, 0));
    const p2 = sk.add_point(new Vector(1, 0));
    const p3 = sk.add_point(new Vector(2, 0));


    const transfered_length = length / original_p1.distance(original_p2);
    const a = findControlPoint(transfered_length);

    const ctr_point = sk.add_point(
        (new Vector(1, -1)).mult(a)
    );

    const l1 = sk.line_between_points(p1, ctr_point);
    const l2 = sk.line_between_points(p2, ctr_point);

    const int1 = sk.interpolate_lines(l1, l2, 2);
    const int2 = sk.copy_line(int1, p3, p2);

    /*
                (a,a)
               /     \
             /         \
        (0,0)-----------(1,0)
    */

    const merged = sk.merge_lines(int1, int2);

    return original_sk._line_between_points_from_sample_points(
        original_p1, original_p2, merged.get_sample_points());
}

function estimate_length(a: number, n: number = 1000) {
    let old_pt = new Vector(0, 0);
    let sum = 0;
    for (let i = 1; i <= n; i++) {
        const t = i / n;
        const new_pt = new Vector(
            2 * a * (1 - t) * t + t * t,
            2 * a * (1 - t) * t
        );

        sum += old_pt.distance(new_pt);
        old_pt = new_pt
    }

    return sum;
}

function findControlPoint(
    LHS: number,
    tolerance: number = 1e-6,
    maxIterations: number = 1000
) {
    let lowerBound = 0.0;
    let upperBound = 10.0; // Initial guess range; could be adjusted
    let iterations = 0;

    while (iterations < maxIterations) {
        const mid = (lowerBound + upperBound) / 2;
        const currentLength = estimate_length(mid);

        if (Math.abs(currentLength - LHS) < tolerance) {
            return mid;
        }

        if (currentLength < LHS) {
            lowerBound = mid;
        } else {
            upperBound = mid;
        }

        iterations++;
    }

    throw new Error("Invalid length attribute");
}
