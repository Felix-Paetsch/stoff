import { Vector } from "@/Core/geometry";
import { grid_from_function, map_grid } from "@/Core/grid";
import { Interval } from "@/Core/numerics";
import { render_number_grid, render_vector_grid } from "@/Core/rendering";
import { Sketch } from "@/Core/sketch";
import { Out } from "@/Dev";
import { concave_outline } from "Core/unstructured/concave_outline";

export default function () {
    const vec_grid = grid_from_function(
        "vector",
        {
            domain_dimensions: [-2, -1.5, 3, 3],
            lattice_dimensions: [500, 500],
        },
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
    Out.put(render_vector_grid(vec_grid));

    const num_grid = map_grid("number", vec_grid, (v) =>
        Interval.clamp([0, 100], Math.log1p(5 * v.length())),
    );

    const im = render_number_grid(num_grid);
    Out.put(im, "mandelbrot");

    num_grid.remap_domain_in_place([0, 0, 8, 8]);

    const s = new Sketch();
    for (let i = 0; i < 5; i++) {
        const bool_grid = map_grid("boolean", num_grid, (v) => v < 4 + i);

        const outline = concave_outline(bool_grid, {
            concavity: 1,
            length_threshold: 0.0001,
        });

        s.add_line(outline.resample_strict(0.4));
    }

    return s;
}
