import { FiniteGeometry, GeometryAlgorithms, Polygon } from "@/Core/geometry";
import { Sketch, SketchRendering } from "@/Core/sketch";
import { Vector } from "Core/geometry/vector";
import { Embroidery } from "Embroidery/Lib/embroidery";

export default function () {
    let circles: Polygon[] = [];
    for (let i = 0; i < 10; i++) {
        for (let j = 0; j < 10; j++) {
            circles.push(
                FiniteGeometry.circle(new Vector(i, j), 0.8).resample(0.3),
            );
        }
    }

    const s = new Sketch();
    circles.forEach((c) => s.add_line(c));

    let merged = GeometryAlgorithms.merge_shapes(circles).remove_dubplicates();
    let se = merged.self_intersection_positions();

    se.forEach(([a, b]) => {
        SketchRendering.set_styles(s.add_point(a.vec), {
            fill: "red",
            radius: 5,
        });
        SketchRendering.set_styles(s.add_point(b.vec), {
            fill: "blue",
            radius: 2,
            stroke_width: 0,
        });
    });

    merged = GeometryAlgorithms.walk_with_self_intersections(merged);

    const e = new Embroidery();
    e.run(merged.as_polyline().resample_strict(0.3, Math.PI / 4));

    return [s, e];
}
