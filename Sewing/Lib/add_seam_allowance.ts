import { Expect } from "@/Core/expect";
import { GeometryAlgorithms, Polyline, Shape } from "@/Core/geometry";
import { Sketch, SketchAlgorithms } from "@/Core/sketch";

export function add_seam_allowance(s: Sketch, amt: number) {
    const perims = SketchAlgorithms.connected_component_perimeters(s);
    perims.map((p) => {
        Expect.that(p.walk.length == p.loops[0]!.lines.length);

        const loop = p.loops[0]!;
        let shape: Shape.Shape = new Polyline([]);
        for (let i = 0; i < loop.lines.length; i++) {
            if (loop.lines[i]?.same_orientation(loop.points[i]!)) {
                shape = GeometryAlgorithms.merge_shapes([
                    shape,
                    loop.lines[i]!.shape,
                ]);
            } else {
                shape = GeometryAlgorithms.merge_shapes([
                    shape,
                    loop.lines[i]!.shape.reverse(),
                ]);
            }
        }

        s.add_line(shape.buffer(amt, ["miter", 1.5], "round")[0]!);
    });
}
