import SewingSketch from "../../../Core/PatternLib/sewing_sketch.js";

export default function () {
    const r = new SewingSketch();
    const points = [r.add(0, 0), r.add(0, 1), r.add(1, 0), r.add(1, 1)];

    for (let i = 0; i < points.length; i++) {
        for (let j = i + 1; j < points.length; j++) {
            r.line_between_points(points[i], points[j]);
        }
    }

    const b = r.get_boundary();

    return r;
}
