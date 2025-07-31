import SewingSketch from "../../../Core/PatternLib/sewing_sketch.js";

export default function () {
    const r: SewingSketch = new SewingSketch();
    const points = [r.add(0, 0), r.add(0, 100), r.add(-20, 50)];

    const l = (r as any).line_between_points(points[0], points[1]);

    return r;
}
