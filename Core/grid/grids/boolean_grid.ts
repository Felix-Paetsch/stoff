import { IterUtils } from "Core/utils/index";
import { Grid, GridDimensions } from "./grid";
import { remap_domain_using_iterable } from "./remap_domain";
import { GridArray } from "./types";

export class BooleanGrid extends Grid<boolean> {
    constructor(dr: GridDimensions, values: BooleanGridArray) {
        super(dr, values);
    }

    with_new_dimensions(
        new_dimensions: Partial<GridDimensions> = {},
    ): BooleanGrid {
        return remap_domain_using_iterable(
            this,
            new_dimensions,
            (dims, it) =>
                new BooleanGrid(
                    dims,
                    BooleanGridArray.from_iterable(
                        it,
                        dims.lattice_dimensions[0] * dims.lattice_dimensions[1],
                    ),
                ),
        );
    }

    static from_iterable(
        dims: GridDimensions,
        it: Iterable<boolean>,
    ): BooleanGrid {
        return new BooleanGrid(
            dims,
            BooleanGridArray.from_iterable(
                it,
                dims.lattice_dimensions[0] * dims.lattice_dimensions[1],
            ),
        );
    }
}

export class BooleanGridArray implements GridArray<boolean> {
    constructor(public arr: Uint8Array) {}

    length() {
        return this.arr.length;
    }

    as_array() {
        return Array.from(this.arr).map((v) => v == 1);
    }

    get(at: number) {
        return this.arr[at]! == 1;
    }

    set(at: number, v: boolean) {
        this.arr[at] = v ? 1 : 0;
    }

    into_array(): boolean[] {
        return this.as_array();
    }

    lerp(a: boolean, b: boolean, t: number): boolean {
        if (t <= 0.5) {
            return a;
        }
        return b;
    }

    [Symbol.iterator](): Iterator<boolean> {
        const arr_it = this.arr[Symbol.iterator]();
        return {
            next(): IteratorResult<boolean> {
                let next = arr_it.next();
                if (next.done) return { value: undefined, done: true };
                return { value: next.value! == 1, done: false };
            },
        };
    }

    static from_iterable(it: Iterable<boolean>, len: number) {
        let res = new Uint8Array(len);

        for (const [i, v] of IterUtils.enumerate(it)) {
            res[i] = v ? 1 : 0;
        }

        return new BooleanGridArray(res);
    }
}
