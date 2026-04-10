import { Polyline, Vector } from "@/Core/geometry";
import { Sketch } from "../../../Core/sketch/sketch";

export default function (): Sketch | Sketch[] | void {
    const s = new Sketch();

    const p = s.add_point(0, 0);
    const q = s.add_point(1, 1);
    // const r = s.point(2, 2);

    const shape = Polyline.from_function(
        (x) => new Vector(x, Math.sin(Math.PI * x)),
    );

    s.line_between_points(p, q, shape);

    const t = s.copy().sketch;
    t.add_point(5, 0);

    return [s, t];
}
