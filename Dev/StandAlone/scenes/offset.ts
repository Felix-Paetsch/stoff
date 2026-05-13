import { FiniteGeometry, Sketch, Vector } from "@/Core";

export default function () {
    const circle = FiniteGeometry.circle(Vector.ZERO, 10).resample(Math.PI * 3);

    const s = new Sketch();
    s.add_line(circle);
    s.add_line(circle.buffer(3)[0]!);
    s.add_line(circle.buffer(4, "miter")[0]!);

    return s;
}
