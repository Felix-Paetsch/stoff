import {
    FiniteGeometry,
    merge_shapes,
    Polygon,
    Polyline,
    Shape,
    walk_with_self_intersections,
} from "@/Core/geometry";
import { Sketch } from "@/Core/sketch";
import { Performance } from "@/Dev";
import { Vector } from "Core/geometry/vector";
import { Embroidery } from "ProcedualArt/embroidery";
import { SketchRendering } from "ProcedualArt/rendering";

export default function () {
    return Performance.time(() => {
        let circles: Polygon[] = [];
        for (let i = 0; i < 10; i++) {
            for (let j = 0; j < 10; j++) {
                circles.push(
                    FiniteGeometry.circle(new Vector(i, j), 0.8).resample(0.1),
                );
            }
        }

        const s = new Sketch();
        circles.forEach((c) => s.add_line(c));

        let merged: Shape.Shape = Polyline.empty();

        Performance.time(() => {
            merged = merge_shapes(circles).remove_dubplicates();
        }, "Merge circles");

        let se = Performance.time(() => {
            return merged.self_intersection_positions();
        }, "SelfIntPos");

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

        Performance.time(() => {
            merged = walk_with_self_intersections(merged);
        }, "Walk without self ints");

        merged = merged.as_polyline().resample_strict(0.3, Math.PI / 4);

        const e = new Embroidery();
        e.run(merged);

        return [s, e];
    });
}
