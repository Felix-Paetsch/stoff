import { Vector } from "Core/geometry/vector";
import {
    GridTypeName,
    GridValueType,
    InternalGrid,
    LatticePoint,
} from "../../types";

import { IGrid } from "../igrid";
import { createIGridConstructor } from "../iGridConstructors/create_constructur";
import { IGridConstructor } from "../iGridConstructors/types";
import { vector_at_lattice_point } from "./dimensions";

export function map_grid<T, N extends GridTypeName>(
    to: N,
    src: IGrid<T, any>,
    fn: (v: T, vec: Vector) => GridValueType<N>,
): InternalGrid & { type: N };
export function map_grid<T, S, R extends string>(
    to: IGridConstructor<S, R>,
    src: IGrid<T, any>,
    fn: (v: T, vec: Vector) => S,
): IGrid<S, R>;
export function map_grid<T, R extends string>(
    to: any,
    src: IGrid<any, any>,
    fn: (v: any, vec: Vector) => T,
): IGrid<T, R> {
    const constr: IGridConstructor<T, R> = createIGridConstructor(to);

    const [w, h] = src.dimensions_ref.lattice_dimensions;
    const res: T[] = [];

    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            let p: LatticePoint = [x, y];

            res.push(
                fn(
                    src.value_at_lattice_point(p),
                    vector_at_lattice_point(src.dimensions_ref, p),
                ),
            );
        }
    }

    return constr(src.dimensions(), res);
}
