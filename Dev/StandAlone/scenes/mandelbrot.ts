import { Color, Grid, Interval, Sketch, Vector } from "@/Core";
import { Out } from "@/Dev";
import { NumberGrid } from "Core/grid/number_grid";

export default function () {
    const s = new Sketch();

    const grid = Grid.NumberGrid.from_function(
        [-2.3, -1.5, 3, 3],
        [499, 499],
        (c: Vector) => {
            let z = Vector.ZERO;

            for (let i = 0; i < 100; i++) {
                z = z.cplx_mult(z).add(c);
                if (z.length() > 100) return z.length();
            }

            return z.length();
        },
    );

    const buf = Grid.GridRendering.lerp_grid_png(grid, (l) => {
        const l_ln = Math.log(l);

        const clmp_interval: Interval.Interval = [0, 6];
        const remap = Interval.remap(clmp_interval, Interval.UnitInterval);

        const int = Color.lerp(
            "black",
            "white",
            Interval.clamp(Interval.UnitInterval, remap(l_ln + 0.00001)),
        );
        return int;
    });
    Out.file(buf, "mandelbrot.png");

    const buf2 = Grid.GridRendering.number_grid_png(
        NumberGrid.promote(grid.map((_a, _b, v) => Math.log(v))),
    );
    Out.file(buf2, "mandelbrot2.png");

    return s;
}
