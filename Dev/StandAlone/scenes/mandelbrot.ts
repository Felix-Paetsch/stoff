import { Color, Grid, Interval, Sketch, Vector } from "@/Core";
import { Out } from "@/Dev";

export default function () {
    const s = new Sketch();

    const grid = Grid.VectorGrid.from_function(
        [-5, -5, 10, 10],
        [50, 50],
        (c: Vector) => {
            // let z = Vector.ZERO;

            // for (let i = 0; i < 100; i++) {
            //     z = z.cplx_mult(z).add(c);
            //     if (z.length() > 100) return z;
            // }

            return c.cplx_mult(c).cplx_mult(c);
        },
    );

    const bufA = Grid.GridRendering.vector_grid(grid);
    Out.put(bufA);

    const buf = Grid.GridRendering.lerp_grid_png(grid, (l) => {
        const l_ln = Math.log1p(l.length());

        const clmp_interval: Interval.Interval = [0, 3];
        const remap = Interval.remap(clmp_interval, Interval.UnitInterval);

        const int = Color.lerp(
            "black",
            "white",
            Interval.clamp(Interval.UnitInterval, remap(l_ln + 0.00001)),
        );
        return int;
    });
    Out.file(buf, "mandelbrot.png");

    return s;
}
