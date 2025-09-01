import { hot_at_url } from "@/Core/Debug/render_at.js";
import SewingSketch from "../../../Core/PatternLib/sewing_sketch.js";
import { Sewing } from "@/Core/Sewing/sewing.js";
import { start_recording } from "@/Core/Debug/recording.js";

export default function () {
    const r = new SewingSketch();
    start_recording(r, "/dev");
    const points = [
        r.add(0, 0), r.add(100, 0),
        r.add(50, 50),
        r.add(0, 100), r.add(100, 100)
    ];

    const lt = r.line_between_points(points[0], points[1]);
    r.line_between_points(points[1], points[4])
    r.line_between_points(points[0], points[3])

    const lb = r.line_between_points(points[3], points[4]);
    const l = r.line_between_points(points[2], points[0]);

    const u = r.line_between_points(points[2], points[3]);
    // console.log(FaceAtlas.from_lines(r.get_lines()));
    const s = new Sewing([r, r.copy(), r.copy()])
    const T = s.cut(lt);
    const B = s.cut(lb);
    const l1 = s.fold(l);


    s.sewing_lines
    const r2 = s.sew(T, [{
        line: B,
        same_orientation: true,
        same_handedness: true,
    }]);
    s.cut(u);
    return s;
}
