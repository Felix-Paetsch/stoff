import { render_sketch } from "@/Core/sketch/rendering";
import { Sketch } from "../../../Core/sketch/sketch/index";

export default function (): Sketch | Sketch[] | void {
    const s = new Sketch();

    const p = s.point(0, 0);
    const q = s.point(1, 1);
    const r = s.point(2, 2);

    s.line_between_points(p, q);
    s.line_between_points(r, q);

    console.log(render_sketch(s, 500, 500, 100).svg());
    return s;
}
