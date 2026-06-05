import { Vector } from "@/Core/geometry";
import { IterUtils } from "Core/utils/index";
import { Grid, GridDimensions } from "./grid";
import { remap_domain_using_iterable } from "./remap_domain";
import { GridArray } from "./types";

export class VectorGrid extends Grid<Vector> {
    constructor(dr: GridDimensions, values: VectorGridArray) {
        super(dr, values);
    }

    with_new_dimensions(
        new_dimensions: Partial<GridDimensions> = {},
    ): VectorGrid {
        return remap_domain_using_iterable(
            this,
            new_dimensions,
            (dims, it) =>
                new VectorGrid(
                    dims,
                    VectorGridArray.from_iterable(
                        it,
                        dims.lattice_dimensions[0] * dims.lattice_dimensions[1],
                    ),
                ),
        );
    }

    static from_iterable(
        dims: GridDimensions,
        it: Iterable<Vector>,
    ): VectorGrid {
        return new VectorGrid(
            dims,
            VectorGridArray.from_iterable(
                it,
                dims.lattice_dimensions[0] * dims.lattice_dimensions[1],
            ),
        );
    }
}

export class VectorGridArray implements GridArray<Vector> {
    constructor(public arr: Float64Array) {}

    length() {
        return this.arr.length;
    }

    as_array() {
        let values: Vector[] = [];
        for (let i = 0; i < this.arr.length; i += 2) {
            values.push(new Vector(this.arr[i]!, this.arr[i + 1]!));
        }
        return values;
    }

    get(at: number) {
        return new Vector(this.arr[at * 2]!, this.arr[at * 2 + 1]!);
    }

    set(at: number, v: Vector) {
        this.arr[2 * at] = v.x;
        this.arr[2 * at + 1] = v.y;
    }

    into_array(): Vector[] {
        return this.as_array();
    }

    lerp(a: Vector, b: Vector, t: number): Vector {
        return Vector.lerp(a, b, t);
    }

    [Symbol.iterator](): Iterator<Vector> {
        const arr_it = this.arr[Symbol.iterator]();
        return {
            next(): IteratorResult<Vector> {
                let next1 = arr_it.next();
                if (next1.done) return { value: undefined, done: true };

                const value = new Vector(next1.value, arr_it.next().value!);
                return { value, done: false };
            },
        };
    }

    static from_iterable(it: Iterable<Vector>, len: number) {
        let res = new Float64Array(3 * len);

        for (const [i, v] of IterUtils.enumerate(it)) {
            res[2 * i] = v.x;
            res[2 * i + 1] = v.y;
        }

        return new VectorGridArray(res);
    }
}
