import { GridAlgorithms } from "@/Algorithms";
import { Interval, Vector } from "@/Core/geometry";
import { GridRendering, NumberGrid, VectorGrid } from "@/Core/grid";
import { Sketch } from "@/Core/sketch";
import { Out } from "@/Dev";

export default function () {
    const vec_grid = VectorGrid.from_function(
        [-2, -1.5, 3, 3],
        [500, 500],
        (c: Vector) => {
            let z = Vector.ZERO;

            for (let i = 0; i < 100; i++) {
                z = z.cplx_mult(z).add(c);
                if (z.length() > 100) return z;
            }

            return z;
        },
    );
    vec_grid.remap_domain_in_place([0, 0, 8, 8]);
    Out.put(GridRendering.vector_grid(vec_grid));

    const num_grid = NumberGrid.from(vec_grid, (v) =>
        Interval.clamp([0, 100], Math.log1p(5 * v.length())),
    );

    const buf = GridRendering.number_grid_png(num_grid);
    Out.file(buf, "mandelbrot.png");

    num_grid.remap_domain_in_place([0, 0, 8, 8]);

    const s = new Sketch();
    for (let i = 0; i < 5; i++) {
        const bool_grid = num_grid.map((v) => v < 4 + i);

        const outline = GridAlgorithms.concave_outline(bool_grid, {
            concavity: 1,
            length_threshold: 0.0001,
        });

        s.add_line(outline.resample_strict(0.4));
    }

    return s;
}
