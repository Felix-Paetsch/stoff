import { Expect } from "Core/expect";
import {
    GridTypeName,
    GridValueType,
    InternalGrid,
    LatticePoint
} from "ProcedualArt/primitives/grid/types";
import { create_grid_constructor, Grid, GridConstructor } from "../index";
import { GridWindowFunction } from "./types";

export function map_chunks<T, N extends GridTypeName>(
    to: N,
    src: Grid<T, any>,
    ker_size: [number, number],
    fn: GridWindowFunction<T, GridValueType<N>>
): InternalGrid & { type: N };
export function map_chunks<T, S, R extends string>(
    to: GridConstructor<S, R>,
    src: Grid<T, any>,
    ker_size: [number, number],
    fn: GridWindowFunction<T, S>
): Grid<S, R>;
export function map_chunks<T, R extends string>(
    to: any,
    src: Grid<any, any>,
    ker_size: [number, number],
    fn: GridWindowFunction<any, T>
): Grid<T, R> {
    const constr: GridConstructor<T, R> = create_grid_constructor(to);
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
                    p
                )
            );
        }
    }

    const lattice_dimensions: [number, number] = [
        Math.trunc(w / ker_w),
        Math.trunc(h / ker_h)
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
                (lattice_dimensions[1] - 1) * new_h_per_unit
            ]
        },
        res
    );
}

export function iter_chunks<T>(
    src: Grid<T, any>,
    ker_size: [number, number],
    fn: GridWindowFunction<T, void>
): void {
    const [w, h] = src.dimensions_ref.lattice_dimensions;

    const [ker_w, ker_h] = ker_size;

    const skipped_left = Math.floor((w % ker_w) / 2);
    const skipped_up = Math.floor((h % ker_h) / 2);

    for (let y0 = skipped_up; y0 <= h - ker_h; y0 += ker_h) {
        for (let x0 = skipped_left; x0 <= w - ker_w; x0 += ker_w) {
            const p: LatticePoint = [x0, y0];

            fn(
                (q) => src.value_at_lattice_point([p[0] + q[0], p[1] + q[1]]),
                p
            );
        }
    }
}
