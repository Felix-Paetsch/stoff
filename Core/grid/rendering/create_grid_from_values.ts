import { Expect } from "Core/expect";
import { Vector } from "Core/geometry/vector";
import { Grid, GridDimensions } from "../grids/grid";
import {
    AssociatedGrid,
    GridValue,
    is_boolean,
    is_number,
    is_vector,
    Vec3,
} from "../grids/types";

import { BooleanGrid } from "../grids/boolean_grid";
import { NumberGrid } from "../grids/number_grid";
import { Vec3Grid } from "../grids/vec3_grid";
import { VectorGrid } from "../grids/vector_grid";

export function create_grid_from_values(
    dimensions_ref: GridDimensions,
    values_ref: number[],
): AssociatedGrid<number>;
export function create_grid_from_values(
    dimensions_ref: GridDimensions,
    values_ref: Vector[],
): AssociatedGrid<Vector>;
export function create_grid_from_values(
    dimensions_ref: GridDimensions,
    values_ref: boolean[],
): AssociatedGrid<boolean>;
export function create_grid_from_values(
    dimensions_ref: GridDimensions,
    values_ref: Vec3[],
): AssociatedGrid<Vec3>;
export function create_grid_from_values(
    dimensions_ref: GridDimensions,
    values_ref: GridValue[],
): any;
export function create_grid_from_values(
    dimensions_ref: GridDimensions,
    values_ref: GridValue[],
): Grid<any> {
    const first = Expect.defined(values_ref[0]);

    if (is_vector(first)) {
        return new VectorGrid(dimensions_ref, values_ref as Vector[]);
    }

    if (is_number(first)) {
        return new NumberGrid(dimensions_ref, values_ref as number[]);
    }

    if (is_boolean(first)) {
        return new BooleanGrid(dimensions_ref, values_ref as boolean[]);
    }

    return new Vec3Grid(dimensions_ref, values_ref as Vec3[]);
}
