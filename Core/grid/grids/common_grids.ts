import { Vector } from "Core/geometry/vector";
import { from_function as ff } from "./from_function";
import { Grid } from "./grid";
import { number_interpolator, vector_interpolator } from "./grid_interp";
import { InterpolationGrid } from "./interpolation_grid";

export type VectorGrid = InterpolationGrid<Vector>;
export namespace VectorGrid {
    export function promote(g: Grid<Vector>): VectorGrid {
        return InterpolationGrid.promote(g, vector_interpolator());
    }

    export function from_function(
        dimensions: [number, number, number, number],
        grid_dimensions: [number, number],
        fn: (pos: Vector) => Vector,
    ) {
        const g = ff(dimensions, grid_dimensions, fn);
        return promote(g);
    }

    export function from<T>(g: Grid<T>, map: (v: T) => Vector): VectorGrid {
        return promote(g.map(map));
    }
}

export type NumberGrid = InterpolationGrid<number>;
export namespace NumberGrid {
    export function promote(g: Grid<number>): NumberGrid {
        return InterpolationGrid.promote(g, number_interpolator());
    }

    export function from_function(
        dimensions: [number, number, number, number],
        grid_dimensions: [number, number],
        fn: (pos: Vector) => number,
    ) {
        const g = ff(dimensions, grid_dimensions, fn);
        return promote(g);
    }

    export function from<T>(g: Grid<T>, map: (v: T) => number): NumberGrid {
        return promote(g.map(map));
    }
}
