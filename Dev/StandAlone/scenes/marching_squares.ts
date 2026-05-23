import { GridAlgorithms } from "@/Algorithms";
import { GridRendering, NumberGrid, VectorGrid } from "@/Core/grid";
import { Sketch } from "@/Core/sketch";
import { Out } from "@/Dev";
import { Vector } from "Core/geometry/vector";

export default function () {
    const grid = VectorGrid.from_function(
        [-2, -2, 4, 4],
        [500, 500],
        (c: Vector) => {
            return c.cplx_mult(c);
        },
    );

    const mapped_grid = NumberGrid.from(grid, (v) => v.length());
    const buf = GridRendering.number_grid_png(mapped_grid);
    Out.file(buf, "mandelbrot.png");

    const s = new Sketch();
    const height_lines = GridAlgorithms.maching_squares(mapped_grid);

    height_lines.forEach((l) => s.add_line(l));

    return s;
}
