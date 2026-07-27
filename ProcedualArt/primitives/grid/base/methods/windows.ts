import { Expect } from "Core/expect";
import {
    GridTypeName,
    GridValueType,
    InternalGrid,
    LatticePoint
} from "ProcedualArt/primitives/grid/types";
import { create_grid_constructor, Grid, GridConstructor } from "../index";
import { GridWindowFunction } from "./types";

export function map_windows<T, N extends GridTypeName>(
    to: N,
    src: Grid<T, any>,
    ker_size: [number, number],
    fn: GridWindowFunction<T, GridValueType<N>>
): InternalGrid & { type: N };
export function map_windows<T, S, R extends string>(
    to: GridConstructor<S, R>,
    src: Grid<T, any>,
    ker_size: [number, number],
    fn: GridWindowFunction<T, S>
): Grid<S, R>;
export function map_windows<T, R extends string>(
    to: any,
    src: Grid<any, any>,
    ker_size: [number, number],
    fn: GridWindowFunction<any, T>
): Grid<T, R> {
    const constr: GridConstructor<T, R> = create_grid_constructor(to);
    Expect.that(ker_size[0] > 0 && ker_size[1] > 0);

    const [w, h] = src.dimensions_ref.lattice_dimensions;
    const res: T[] = [];

    for (let y0 = 0; y0 <= h - ker_size[1]; y0++) {
        for (let x0 = 0; x0 <= w - ker_size[0]; x0++) {
            const p: LatticePoint = [x0, y0];

            res.push(
                fn(
                    (q) =>
                        src.value_at_lattice_point([p[0] + q[0], p[1] + q[1]]),
                    p
                )
            );
        }
    }

    const [x0, y0, dx, dy] = src.dimensions_ref.domain_dimensions;
    const unit_width = dx / (w - 1);
    const unit_height = dy / (h - 1);

    const padding_x = ((ker_size[0] - 1) * unit_width) / 2;
    const padding_y = ((ker_size[1] - 1) * unit_height) / 2;

    return constr(
        {
            lattice_dimensions: [w - ker_size[0] + 1, h - ker_size[1] + 1],
            domain_dimensions: [
                x0 + padding_x,
                y0 + padding_y,
                dx - 2 * padding_x,
                dy - 2 * padding_y
            ]
        },
        res
    );
}

export function iter_windows<T>(
    src: Grid<T, any>,
    ker_size: [number, number],
    fn: GridWindowFunction<T, void>
): void {
    const [w, h] = src.dimensions_ref.lattice_dimensions;
    for (let y0 = 0; y0 <= h - ker_size[1]; y0++) {
        for (let x0 = 0; x0 <= w - ker_size[0]; x0++) {
            const p: LatticePoint = [x0, y0];

            fn(
                (q) => src.value_at_lattice_point([p[0] + q[0], p[1] + q[1]]),
                p
            );
        }
    }
}
