import { Vector } from "Core/geometry/vector";
import {
    GridTypeName,
    GridValueType,
    InternalGrid,
    LatticePoint
} from "../../types";

import { create_grid_constructor, Grid, GridConstructor } from "../index";
import { vector_at_lattice_point } from "./vector_lattice_point_conversion";

export function map_grid<T, N extends GridTypeName>(
    to: N,
    src: Grid<T, any>,
    fn: (v: T, vec: Vector) => GridValueType<N>
): InternalGrid & { type: N };
export function map_grid<T, S, R extends string>(
    to: GridConstructor<S, R>,
    src: Grid<T, any>,
    fn: (v: T, vec: Vector) => S
): Grid<S, R>;
export function map_grid<T, R extends string>(
    to: any,
    src: Grid<any, any>,
    fn: (v: any, vec: Vector) => T
): Grid<T, R> {
    const constr: GridConstructor<T, R> = create_grid_constructor(to);

    const [w, h] = src.dimensions_ref.lattice_dimensions;
    const res: T[] = [];

    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            let p: LatticePoint = [x, y];

            res.push(
                fn(
                    src.value_at_lattice_point(p),
                    vector_at_lattice_point(src.dimensions_ref, p)
                )
            );
        }
    }

    return constr(src.dimensions(), res);
}
