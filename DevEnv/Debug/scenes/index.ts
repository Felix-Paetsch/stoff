import { Sketch } from "@/Core/StoffLib/sketch";
import { copy_line } from "@/Core/StoffLib/sketch_methods/line_methods";

export default function () {
    console.log("ENTER");
    const s = new Sketch();
    const pts = [s.point(0, 0), s.point(1, 0)] as const;

    const l = s.line_from_function_graph(...pts, (x) => Math.sin(3 * Math.PI * x));

    // s.dev.hot_at_url("/hot_simple");

    copy_line(l, l.p1, l.p2).smooth_out(.2).smooth_out(0.2).smooth_out(0.2);
    copy_line(l, l.p1, l.p2).smooth_out(.2).smooth_out(0.2);
    copy_line(l, l.p1, l.p2).smooth_out(.2);

    console.log("EXIT");
    return s;
}
