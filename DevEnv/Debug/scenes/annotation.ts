import FaceAtlas from "@/Core/PatternLib/faces/faceAtlas.js";
import SewingSketch from "../../../Core/PatternLib/sewing_sketch.js";
import { Sewing } from "@/Core/Sewing/sewing.js";

export default function () {
    const r = new SewingSketch();

    const points = [r.add(0, 0), r.add(0, 100), r.add(-20, 50)];

    r.line_between_points(points[0], points[1]);
    r.line_between_points(points[1], points[2]);
    const l = r.line_between_points(points[2], points[0]);

    console.log(
        FaceAtlas.from_lines(r.get_lines())
    );
    const s = new Sewing([r, r, r])
    s.cut(l);
    return s;
}
