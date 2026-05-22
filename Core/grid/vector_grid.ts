import { Vector } from "Core/geometry/vector";
import { from_function } from "./from_function";
import { Grid, Lerp } from "./grid";

export class VectorGrid extends Grid<Vector> {
    override resample(
        new_dimensions: [number, number, number, number],
        new_sample_amt: [number, number],
    ): VectorGrid;
    override resample(
        new_dimensions: [number, number, number, number],
        new_sample_amt: [number, number],
        lerp: Lerp<Vector>,
    ): VectorGrid;
    override resample(
        new_dimensions: [number, number, number, number],
        new_sample_amt: [number, number],
        lerp?: Lerp<Vector>,
    ): VectorGrid {
        if (!lerp) {
            lerp = Vector.lerp;
        }
        let g = super.resample(new_dimensions, new_sample_amt, lerp);
        return new VectorGrid(
            g.dimensions(),
            g.grid_dimensions(),
            g.values_by_ref(),
        );
    }

    override sample_at(x: number, y: number): Vector;
    override sample_at(x: number, y: number, interp: Lerp<Vector>): Vector;
    override sample_at(x: number, y: number, interp?: Lerp<Vector>): Vector {
        if (!interp) {
            interp = Vector.lerp;
        }
        return super.sample_at(x, y, interp);
    }

    static from_function(
        dimensions: [number, number, number, number],
        grid_dimensions: [number, number],
        fn: (pos: Vector) => Vector,
    ): VectorGrid {
        const g = from_function(dimensions, grid_dimensions, fn);
        return VectorGrid.promote(g);
    }

    static promote(g: Grid<Vector>): VectorGrid {
        return new VectorGrid(
            g.dimensions(),
            g.grid_dimensions(),
            g.values_by_ref(),
        );
    }
}
