import { Vector } from "Core/geometry/vector";
import { Grid, GridDimensions } from "./grid";
import { GridArray } from "./types";

export class JSArrayGrid<T> extends Grid<T, JSArrayGridArray<T>> {
    constructor(
        dr: GridDimensions,
        values: T[],
        lerp: (a: T, b: T, t: number) => T,
    ) {
        super(dr, new JSArrayGridArray(values, lerp));
    }

    with_new_dimensions(
        new_dimensions_: Partial<GridDimensions> = {},
    ): JSArrayGrid<T> {
        const new_dimensions =
            this.complete_partial_subgrid_dimensions(new_dimensions_);
        const [new_w, new_h] = new_dimensions.lattice_dimensions;
        const [x, y, w, h] = new_dimensions.domain_dimensions;

        const new_values: T[] = [];
        for (let j = 0; j < new_h; j++) {
            const fy = new_h === 1 ? 0 : j / (new_h - 1);
            const abs_y = y + fy * h;

            for (let i = 0; i < new_w; i++) {
                const fx = new_w === 1 ? 0 : i / (new_w - 1);
                const abs_x = x + fx * w;
                new_values.push(this.sample_at(new Vector(abs_x, abs_y)));
            }
        }

        return new JSArrayGrid(
            new_dimensions,
            new_values,
            this.values_ref.lerp_impl,
        );
    }
}

export class JSArrayGridArray<T> implements GridArray<T> {
    constructor(
        public arr: T[],
        public lerp_impl: (a: T, b: T, t: number) => T,
    ) {}

    length() {
        return this.arr.length;
    }

    as_array() {
        return [...this.arr];
    }

    get(at: number): T {
        return this.arr[at]!;
    }

    set(at: number, v: T) {
        this.arr[at] = v;
    }

    into_array(): T[] {
        return this.arr;
    }

    lerp(a: T, b: T, t: number): T {
        return this.lerp_impl(a, b, t);
    }

    [Symbol.iterator](): Iterator<T> {
        return this.arr[Symbol.iterator]();
    }
}
