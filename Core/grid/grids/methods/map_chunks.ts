import { Expect } from "Core/expect";
import { IGrid } from "Core/grid/grids/igrid";
import { createIGridConstructor } from "Core/grid/grids/iGridConstructors/create_constructur";
import { IGridConstructor } from "Core/grid/grids/iGridConstructors/types";
import {
    GridTypeName,
    GridValueType,
    InternalGrid,
    LatticePoint,
} from "Core/grid/types";
import { EPS } from "Core/numerics/eps";
import { GridWindowFunction } from "./types";

export function map_chunks<T, N extends GridTypeName>(
    to: N,
    src: IGrid<T, any>,
    ker_size: [number, number],
    fn: GridWindowFunction<T, GridValueType<N>>,
): InternalGrid & { type: N };
export function map_chunks<T, S, R extends string>(
    to: IGridConstructor<S, R>,
    src: IGrid<T, any>,
    ker_size: [number, number],
    fn: GridWindowFunction<T, S>,
): IGrid<S, R>;
export function map_chunks<T, R extends string>(
    to: any,
    src: IGrid<any, any>,
    ker_size: [number, number],
    fn: GridWindowFunction<any, T>,
): IGrid<T, R> {
    const constr: IGridConstructor<T, R> = createIGridConstructor(to);
    Expect.that(ker_size[0] > 0 && ker_size[1] > 0);

    const [w, h] = src.dimensions_ref.lattice_dimensions;
    const res: T[] = [];

    const [ker_w, ker_h] = ker_size;

    const skipped_left = Math.floor((w % ker_w) / 2);
    const skipped_up = Math.floor((h % ker_h) / 2);

    for (let y0 = skipped_up; y0 <= h - ker_h; y0 += ker_h) {
        for (let x0 = skipped_left; x0 <= w - ker_w; x0 += ker_w) {
            const p: LatticePoint = [x0, y0];

            res.push(
                fn(
                    (q) =>
                        src.value_at_lattice_point([p[0] + q[0], p[1] + q[1]]),
                    p,
                ),
            );
        }
    }

    const lattice_dimensions: [number, number] = [
        Math.floor((w - 1) / ker_w + EPS.tiny),
        Math.floor((h - 1) / ker_h + EPS.tiny),
    ];

    const [x0, y0, dx, dy] = src.dimensions_ref.domain_dimensions;
    const w_per_unit = dx / (w - 1);
    const h_per_unit = dy / (h - 1);

    const new_w_per_unit = ker_w * w_per_unit;
    const new_h_per_unit = ker_h * h_per_unit;

    return constr(
        {
            lattice_dimensions,
            domain_dimensions: [
                x0 + skipped_left * w_per_unit,
                y0 + skipped_up * h_per_unit,
                (lattice_dimensions[0] - 1) * new_w_per_unit,
                (lattice_dimensions[1] - 1) * new_h_per_unit,
            ],
        },
        res,
    );
}
