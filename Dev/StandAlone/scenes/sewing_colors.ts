import { FiniteGeometry, Sketch, SketchRendering, Vector } from "@/Core";

export default function () {
    const circle = FiniteGeometry.circle(Vector.ZERO, 10);

    const s = new Sketch();
    const l = s.add_line(circle.as_polyline());
    SketchRendering.set_stroke(l, ["blue", "green"]);
    l.data.test = "hi";

    s.add_line(circle.buffer(3)[0]!);

    SketchRendering.set_stroke(s.add_line(circle.buffer(5)[0]!), [
        "red",
        "yellow",
    ]);

    return SketchRendering.render(s, {
        width: 500,
        height: 500,
        padding: 30,
        debug: true,
    });
}
