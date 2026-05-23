import { Interval, Vector } from "Core/geometry/index";
import { Expect } from "../../expect";
import { Grid } from "./grid";
import { GridInterpolator, nearest_lattice_point_lerp } from "./grid_interp";

export class InterpolationGrid<GridType> extends Grid<GridType> {
    constructor(
        dimensions: [number, number, number, number],
        grid_dimensions: [number, number],
        values: GridType[],
        public interp_impl: GridInterpolator<GridType> = nearest_lattice_point_lerp(),
    ) {
        super(dimensions, grid_dimensions, values);
    }

    resample(
        new_dimensions: [number, number, number, number],
        new_sample_spacing: [number, number],
    ): InterpolationGrid<GridType> {
        const [new_w, new_h] = new_sample_spacing;

        Expect.lazy(() => {
            Expect.that(new_w > 0, "new sample width must be > 0");
            Expect.that(new_h > 0, "new sample height must be > 0");
        });

        const [x, y, w, h] = new_dimensions;
        const values: GridType[] = [];

        for (let j = 0; j < new_h; j++) {
            const fy = new_h === 1 ? 0 : j / (new_h - 1);
            const abs_y = y + fy * h;

            for (let i = 0; i < new_w; i++) {
                const fx = new_w === 1 ? 0 : i / (new_w - 1);
                const abs_x = x + fx * w;
                values.push(this.sample_at(new Vector(abs_x, abs_y)));
            }
        }

        return new InterpolationGrid<GridType>(
            new_dimensions,
            [new_w, new_h],
            values,
            this.interp_impl,
        );
    }

    sample_at(v: Vector): GridType {
        const [x, y] = v.to_array();
        const [grid_x, grid_y, grid_w, grid_h] = this.dimensions_ref;
        const [w, h] = this.lattice_dimensions_ref;

        Expect.lazy(() => {
            Expect.that(
                grid_w >= 0,
                "grid width in world space must be non-negative",
            );
            Expect.that(
                grid_h >= 0,
                "grid height in world space must be non-negative",
            );
            Expect.that(
                x >= grid_x && x <= grid_x + grid_w,
                "x is outside grid bounds",
            );
            Expect.that(
                y >= grid_y && y <= grid_y + grid_h,
                "y is outside grid bounds",
            );
        });

        const w_remap = Interval.remap([grid_x, grid_x + grid_w], [0, w - 1]);
        const h_remap = Interval.remap([grid_y, grid_y + grid_h], [0, h - 1]);

        const sx = w_remap(x);
        const sy = h_remap(y);

        const x0 = Interval.clamp([0, w - 1], Math.floor(sx));
        const y0 = Interval.clamp([0, h - 1], Math.floor(sy));
        const x1 = Interval.clamp([0, w - 1], Math.ceil(sx));
        const y1 = Interval.clamp([0, h - 1], Math.ceil(sy));

        const tx = sx - x0;
        const ty = sy - y0;

        const v00 = this.value_at_lattice_point(x0, y0);
        const v10 = this.value_at_lattice_point(x1, y0);
        const v01 = this.value_at_lattice_point(x0, y1);
        const v11 = this.value_at_lattice_point(x1, y1);

        return this.interp_impl(
            {
                tl: v00,
                tr: v10,
                bl: v01,
                br: v11,
            },
            [tx, ty],
        );
    }

    static promote<T>(
        g: Grid<T>,
        interp: GridInterpolator<T> = nearest_lattice_point_lerp(),
    ): InterpolationGrid<T> {
        if (g instanceof InterpolationGrid) return g;

        return new InterpolationGrid(
            g.dimensions(),
            g.lattice_dimensions(),
            g.values_ref,
            interp,
        );
    }
}
