import { Sketch } from "@/Core/StoffLib/sketch";

export default function () {
    const r = new Sketch();
    const points = [
        r.point(0, 0),
        r.point(0, 1),
        r.point(1, 0),
        r.point(1, 1)
    ] as const;

    for (let i = 0; i < points.length; i++) {
        for (let j = i + 1; j < points.length; j++) {
            r.line_between_points(points[i]!, points[j]!);
        }
    }

    return r;
}
