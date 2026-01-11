import { Sewing } from "@/Core/Sewing/sewing";
import { start_recording } from "@/Core/Debug/recording";
import { Sketch } from "@/Core/StoffLib/sketch";

export default function () {
    const r = new Sketch();
    start_recording(r, "/dev");
    const points = [
        r.point(0, 0), r.point(100, 0),
        r.point(50, 50),
        r.point(0, 100), r.point(100, 100)
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
