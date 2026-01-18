import { PatternFunction } from "@/Core/types.js";
import { Sewing } from "@/Core/Sewing/sewing";
import { Sketch } from "@/Core/StoffLib/sketch";

export const create_design: PatternFunction = () => {
    const r = new Sketch();
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

    const s = new Sewing([r])

    const T = s.cut(lt);
    const B = s.cut(lb);

    const sl = s.sewing_line(l);
    s.dev_render();
    const l1 = s.fold(sl);

    const r2 = s.sew(T, [{
        line: B,
        same_orientation: true,
        same_handedness: true,
    }]);
    s.cut(u);
    s.dev_render();
    s.highlight(l1);
    s.dev_render();

    return s.sketches[0];
}
