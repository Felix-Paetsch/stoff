import { Polygon, Shape } from "@/Core/geometry";
import { GridAlgorithms, NumberGrid } from "@/Core/grid";
import { Sketch } from "@/Core/sketch";
import { Performance } from "@/Dev";
import { Vector } from "Core/geometry/vector";
import { Embroidery } from "Embroidery/Lib/embroidery";

export default function () {
    const num_grid = NumberGrid.from_function(
        [-2, -2, 4, 4],
        [500, 500],
        (c: Vector) => {
            let z = Vector.ZERO;

            for (let i = 0; i < 10000; i++) {
                z = z.cplx_mult(z).add(c);
                if (z.length_squared() > 4) return i;
            }

            return 10000;
        },
    );

    num_grid.remap_domain_in_place([0, 0, 8, 8]);
    // Out.file(Grid.GridRendering.number_grid_png(num_grid), "escape vel.png");

    const outlines: Polygon[] = [];
    const s = new Sketch();
    [1, 2, 3, 4, 5, 7, 9, 50, 10000].forEach((x) => {
        const bool_grid = num_grid.map((v) => v >= x);

        const outline = GridAlgorithms.concave_outline(bool_grid, {
            concavity: 1.2,
        });

        s.add_line(outline); //.resample_strict(0.4));
        outlines.push(outline);
    });

    let curr_line = outlines[0]!;

    Performance.time(() => {
        for (let i = 1; i < outlines.length; i++) {
            console.log(curr_line.vertex_count(), outlines[i]!.vertex_count());
            Shape.closest_shape_positions(curr_line, outlines[i]!);
        }
    }, "Closest position");
    // Performance.time(() => {
    //     for (let i = 1; i < outlines.length; i++) {
    //         Shape.intersection_positions(curr_line, outlines[i]!);
    //     }
    // }, "Intersection position");

    const e = new Embroidery();
    const run = curr_line.as_polyline().resample_strict(0.3);
    e.run(run);

    return [s, e];
}
