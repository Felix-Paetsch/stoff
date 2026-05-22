import { Interval, Vector } from "Core/geometry/index";
import { from_function } from "./from_function";
import { Grid, Lerp } from "./grid";

export class NumberGrid extends Grid<number> {
    override resample(
        new_dimensions: [number, number, number, number],
        new_sample_spacing: [number, number],
    ): NumberGrid;
    override resample(
        new_dimensions: [number, number, number, number],
        new_sample_spacing: [number, number],
        lerp: Lerp<number>,
    ): NumberGrid;
    override resample(
        new_dimensions: [number, number, number, number],
        new_sample_spacing: [number, number],
        lerp?: Lerp<number>,
    ): NumberGrid {
        if (!lerp) {
            lerp = Interval.lerp;
        }
        let g = super.resample(new_dimensions, new_sample_spacing, lerp);
        return new NumberGrid(
            g.dimensions(),
            g.grid_dimensions(),
            g.values_by_ref(),
        );
    }

    override sample_at(x: number, y: number): number;
    override sample_at(x: number, y: number, interp: Lerp<number>): number;
    override sample_at(x: number, y: number, interp?: Lerp<number>): number {
        if (!interp) {
            interp = Interval.lerp;
        }
        return super.sample_at(x, y, interp);
    }

    static from_function(
        dimensions: [number, number, number, number],
        grid_dimensions: [number, number],
        fn: (pos: Vector) => number,
    ): NumberGrid {
        const g = from_function(dimensions, grid_dimensions, fn);
        return NumberGrid.promote(g);
    }

    static promote(g: Grid<number>): NumberGrid {
        return new NumberGrid(
            g.dimensions(),
            g.grid_dimensions(),
            g.values_by_ref(),
        );
    }
}
