import { Sketch } from "@/Core";

export default function () {
    const s = new Sketch();

    const p1 = s.add_point(0, 0);
    const p2 = s.add_point(0, 1);
    const q1 = s.add_point(0, 0.5);
    const q2 = s.add_point(1, 0.5);

    const l1 = s.line_between_points(p1, p2);
    const l2 = s.line_between_points(q1, q2);

    console.log(l1.shape.intersection_positions(l2.shape));

    return s;
}
