import { Sketch } from "@/Core";

export default function () {
    const s = new Sketch();

    const pts = [
        s.add_point(0, 0),
        s.add_point(0, 1),
        s.add_point(0.5, 0.7),
    ] as const;

    s.line_between_points(pts[1], pts[2]).data.side = "a";
    s.line_between_points(pts[0], pts[2]).data.side = "b";
    s.line_between_points(pts[1], pts[0]).data.side = "c";

    return s;
}
