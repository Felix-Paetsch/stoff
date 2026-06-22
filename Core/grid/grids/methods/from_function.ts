import { Vector } from "@/Core/geometry";
import {
    GridDimensions,
    GridTypeName,
    GridValueType,
    InternalGrid,
    LatticePoint,
} from "../../types";
import { IGrid } from "../igrid";
import { createIGridConstructor } from "../iGridConstructors/create_constructur";
import { IGridConstructor } from "../iGridConstructors/types";
import { vector_at_lattice_point } from "./dimensions";

export function grid_from_function<N extends GridTypeName>(
    to: N,
    dims: GridDimensions,
    fn: (vec: Vector) => GridValueType<N>,
): InternalGrid & { type: N };
export function grid_from_function<S, T extends string>(
    to: IGridConstructor<S, T>,
    dims: GridDimensions,
    fn: (vec: Vector) => S,
): IGrid<S, T>;
export function grid_from_function<T, S extends string>(
    to: any,
    dims: GridDimensions,
    fn: (vec: Vector) => T,
): IGrid<T, S> {
    const constr: IGridConstructor<T, S> = createIGridConstructor(to);

    const [w, h] = dims.lattice_dimensions;
    const res: T[] = [];

    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            let p: LatticePoint = [x, y];
            res.push(fn(vector_at_lattice_point(dims, p)));
        }
    }

    return constr(dims, res);
}
