import { Grid, GridAlgorithms, GridRendering } from "@/Core/grid";
import { Sketch } from "@/Core/sketch";
import { Out } from "@/Dev";
import { Vector } from "Core/geometry/vector";

export default function () {
    const grid = Grid.from_function(
        {
            domain_dimensions: [-2, -2, 4, 4],
            lattice_dimensions: [500, 500],
        },
        (c: Vector) => {
            return c.cplx_mult(c);
        },
    );

    const mapped_grid = grid.map((v) => v.length());
    const im = GridRendering.render_number_grid(mapped_grid);
    Out.put(im, "mandelbrot.png");

    const s = new Sketch();
    const height_lines = GridAlgorithms.maching_squares(mapped_grid);

    height_lines.forEach((l) => s.add_line(l));

    return s;
}
