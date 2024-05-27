const { assert } = require("../validation.js");
const { Vector } = require("../../Geometry/geometry.js");

module.exports = function line_with_length(original_sk, original_p1, original_p2, length, slopeP1 = 0, slopeP2 = 0){
    assert(slopeP1 == 0 && slopeP2 == 0, "Unimplemented for non-zero slopes!");

    const sk = new original_sk.constructor();
    const p1 = sk.add_point(new Vector(0,0));
    const p2 = sk.add_point(new Vector(1,0));
    const p3 = sk.add_point(new Vector(2,0));


    const transfered_length = length/original_p1.distance(original_p2);
    const a = findControlPoint(transfered_length);

    const ctr_point = sk.point(
        (new Vector(1,-1)).mult(a)
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

    int2.mirror();
    const merged = sk.merge_lines(int1, int2);

    return original_sk._line_between_points_from_sample_points(
        original_p1, original_p2, merged.get_sample_points());
}

function estimate_length(a, n = 1000) {
    let old_pt = new Vector(0,0);
    let sum = 0;
    for (let i = 1; i <= n; i++){
        const t = i/n;
        const new_pt = new Vector(
            2*a*(1-t)*t + t * t,
            2*a*(1-t)*t
        );

        sum += old_pt.distance(new_pt);
        old_pt = new_pt
    }

    return sum;
}

function findControlPoint(LHS, tolerance = 1e-6, maxIterations = 1000) {
    let lowerBound = 0.0;
    let upperBound = 10.0; // Initial guess range; can be adjusted
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
