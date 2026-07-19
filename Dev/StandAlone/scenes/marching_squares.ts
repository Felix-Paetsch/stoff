import { grid_from_function, map_grid, marching_squares } from "@/Core/grid";
import { render_number_grid } from "@/Core/rendering";
import { Sketch } from "@/Core/sketch";
import { Out } from "@/Dev";
import { Vector } from "Core/geometry/vector";

export default function () {
    const grid = grid_from_function(
        "vector",
        {
            domain_dimensions: [-2, -2, 4, 4],
            lattice_dimensions: [500, 500],
        },
        (c: Vector) => {
            return c.cplx_mult(c);
        },
    );

    const mapped_grid = map_grid("number", grid, (v) => v.length());
    const im = render_number_grid(mapped_grid);
    Out.put(im, "mandelbrot.png");

    const s = new Sketch();
    const height_lines = marching_squares(mapped_grid);

    height_lines.forEach((l) => s.add_line(l));

    return s;
}
