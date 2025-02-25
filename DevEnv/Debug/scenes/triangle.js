import { vec_angle, triangle_data } from "../../Core/StoffLib/geometry.js";
import Sketch from "../../Core/StoffLib/sketch.js";

export default function() {
    const s = new Sketch();

    const pts = [
        s.point(0, 0),
        s.point(0, 1),
        s.point(0.5, .7)
    ];

    const a = pts[1].subtract(pts[2]);
    s.line_between_points(pts[1], pts[2]).data.side = "a";

    const b = pts[0].subtract(pts[2]);
    s.line_between_points(pts[0], pts[2]).data.side = "b";

    const c = pts[1].subtract(pts[0]);
    s.line_between_points(pts[1], pts[0]).data.side = "c";

    pts[0].data = "alpha"; // A: 1,2
    pts[1].data = "beta";  // B: 0,2
    pts[2].data = "gamma"; // C: 0,1

    const triangle = {
        a: a.length(),
        b: b.length(),
        c: c.length(),
        alpha: vec_angle(b.mult(-1), c),
        beta: vec_angle(a, c),
        gamma: vec_angle(a, b)
    };

    // Copy the triangle data
    const incompleteTriangle = { ...triangle };

    // Randomly delete 3 keys
    const keys = Object.keys(incompleteTriangle);
    for (let i = 0; i < 3; i++) {
        const randomIndex = Math.floor(Math.random() * keys.length);
        delete incompleteTriangle[keys[randomIndex]];
        keys.splice(randomIndex, 1); // Remove the deleted key from the list
    }
    
    // Log the results to compare
    console.log("Original Triangle:", triangle);
    console.log("Incomplete Triangle:", incompleteTriangle);
    const computedTriangle = triangle_data(incompleteTriangle);
    console.log("Computed Triangle:", computedTriangle);

    // Compare the computed triangle with the original triangle
    for (const key of ['a', 'b', 'c', 'alpha', 'beta', 'gamma']) {
        const originalValue = triangle[key];
        const computedValue = computedTriangle[key];
        if (originalValue !== undefined && computedValue !== undefined) {
            const difference = Math.abs(originalValue - computedValue);
            if (difference > 1e-6) {
                throw new Error(`Mismatch in ${key}: original ${originalValue}, computed ${computedValue}, difference ${difference}`);
            }
        }
    }

    // Store the triangle data in the Sketch object for visualization if needed
    s.data = { original: triangle, incomplete: incompleteTriangle, computed: computedTriangle };

    return s;
}
