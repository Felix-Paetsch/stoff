import {
    GridDimensions,
    GridTypeName,
    GridValueType,
    InternalGrid,
} from "../../types";
import { IGrid } from "../igrid";
import { createIGridConstructor } from "../iGridConstructors/create_constructur";
import { IGridConstructor } from "../iGridConstructors/types";

export function grid_from_array<N extends GridTypeName>(
    to: N,
    dims: GridDimensions,
    vals: ArrayLike<GridValueType<N>>,
): InternalGrid & { type: N };
export function grid_from_array<S, T extends string>(
    to: IGridConstructor<S, T>,
    dims: GridDimensions,
    vals: ArrayLike<S>,
): IGrid<S, T>;
export function grid_from_array<T, S extends string>(
    to: any,
    dims: GridDimensions,
    vals: ArrayLike<T>,
): IGrid<T, S> {
    const constr: IGridConstructor<T, S> = createIGridConstructor(to);
    return constr(dims, Array.from(vals));
}
