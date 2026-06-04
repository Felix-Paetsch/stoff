import { Expect } from "Core/expect";
import { Vector } from "Core/geometry/vector";
import {
    AssociatedGrid,
    BooleanGrid,
    GridDimensions,
    GridValue,
    is_boolean,
    is_number,
    is_vector,
    NumberGrid,
    Vec3,
    Vec3Grid,
    VectorGrid,
} from "./index";

function create_grid_from_values(
    dimensions_ref: GridDimensions,
    values_ref: number[],
): AssociatedGrid<number>;
function create_grid_from_values(
    dimensions_ref: GridDimensions,
    values_ref: Vector[],
): AssociatedGrid<Vector>;
function create_grid_from_values(
    dimensions_ref: GridDimensions,
    values_ref: boolean[],
): AssociatedGrid<boolean>;
function create_grid_from_values(
    dimensions_ref: GridDimensions,
    values_ref: Vec3[],
): AssociatedGrid<Vec3>;
function create_grid_from_values(
    dimensions_ref: GridDimensions,
    values_ref: GridValue[],
): any {
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

export function register_grid_from_method(gridClass: any) {
    gridClass.from = create_grid_from_values;
}
