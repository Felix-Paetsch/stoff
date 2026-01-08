import SewingSketch from "../../../Core/PatternLib/sewing_sketch.js";

export default function () {
    const r: SewingSketch = new SewingSketch();
    const points = [r.point(0, 0), r.point(0, 100), r.point(-20, 50)];

    const l = (r as any).line_between_points(points[0], points[1]);

    return r;
}
