import { Interval } from "@/Core/geometry";
import { IterUtils } from "Core/utils/index";
import { Grid, GridDimensions } from "./grid";
import { remap_domain_using_iterable } from "./remap_domain";
import { GridArray, u8 } from "./types";

export class Uint8Grid extends Grid<u8> {
    constructor(dr: GridDimensions, values: Uint8GridArray) {
        super(dr, values);
    }

    with_new_dimensions(
        new_dimensions: Partial<GridDimensions> = {},
    ): Uint8Grid {
        return remap_domain_using_iterable(
            this,
            new_dimensions,
            (dims, it) =>
                new Uint8Grid(
                    dims,
                    Uint8GridArray.from_iterable(
                        it,
                        dims.lattice_dimensions[0] * dims.lattice_dimensions[1],
                    ),
                ),
        );
    }

    static from_iterable(
        dims: GridDimensions,
        it: Iterable<number>,
    ): Uint8Grid {
        return new Uint8Grid(
            dims,
            Uint8GridArray.from_iterable(
                it,
                dims.lattice_dimensions[0] * dims.lattice_dimensions[1],
            ),
        );
    }
}

export class Uint8GridArray implements GridArray<u8> {
    constructor(public arr: Uint8Array) {}

    length() {
        return this.arr.length;
    }

    as_array() {
        return Array.from(this.arr);
    }

    get(at: number) {
        return this.arr[at]!;
    }

    set(at: number, v: number) {
        this.arr[at] = v;
    }

    into_array(): number[] {
        return [...this.arr];
    }

    lerp(a: number, b: number, t: number): number {
        return Math.round(Interval.lerp(a, b, t));
    }

    [Symbol.iterator](): Iterator<u8> {
        return this.arr[Symbol.iterator]();
    }

    static from_iterable(it: Iterable<number>, len: number) {
        let res = new Uint8Array(len);

        for (const [i, v] of IterUtils.enumerate(it)) {
            res[i] = v;
        }

        return new Uint8GridArray(res);
    }
}
