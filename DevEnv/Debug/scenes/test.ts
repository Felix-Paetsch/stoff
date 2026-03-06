import { Sketch } from "@/Core/StoffLib/sketch";

export default function () {
    const r = new Sketch();
    const points = [r.point(0, 0), r.point(0, 100), r.point(-20, 50)] as const;

    r.line_between_points(points[0], points[1]);

    return r;
}
