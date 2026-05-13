import { Expect, Polyline, Shape, Sketch } from "@/Core";
import { compute_connected_component_perimeters } from "Algorithms/compute_connected_component_perimeters";

export function add_seam_allowance(s: Sketch, amt: number) {
    const perims = compute_connected_component_perimeters(s);
    perims.map((p) => {
        Expect.that(p.walk.length == p.loops[0]!.lines.length);

        const loop = p.loops[0]!;
        let shape: Shape.Shape = new Polyline([]);
        for (let i = 0; i < loop.lines.length; i++) {
            if (loop.lines[i]?.same_orientation(loop.points[i]!)) {
                shape = Shape.merge(shape, loop.lines[i]!.shape);
            } else {
                shape = Shape.merge(shape, loop.lines[i]!.shape.reverse());
            }
        }

        s.add_line(shape.buffer(amt, ["miter", 1.5], "square")[0]!);
    });
}
