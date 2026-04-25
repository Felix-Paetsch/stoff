import { FiniteGeometry, Sketch, Vector } from "@/Core";

export default function () {
    const circle = FiniteGeometry.circle(Vector.ZERO, 10).resample(Math.PI * 2);
    circle.buffer(0);

    const s = new Sketch();
    s.add_line(circle);

    return s;
}
