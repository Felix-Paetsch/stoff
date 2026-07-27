import {
    GridDimensions,
    GridTypeName,
    GridValueType,
    InternalGrid
} from "../../types";
import { create_grid_constructor, Grid, GridConstructor } from "../index";

export function grid_from_array<N extends GridTypeName>(
    to: N,
    dims: GridDimensions,
    vals: ArrayLike<GridValueType<N>>
): InternalGrid & { type: N };
export function grid_from_array<S, T extends string>(
    to: GridConstructor<S, T>,
    dims: GridDimensions,
    vals: ArrayLike<S>
): Grid<S, T>;
export function grid_from_array<T, S extends string>(
    to: any,
    dims: GridDimensions,
    vals: ArrayLike<T>
): Grid<T, S> {
    const constr: GridConstructor<T, S> = create_grid_constructor(to);
    return constr(dims, Array.from(vals));
}
