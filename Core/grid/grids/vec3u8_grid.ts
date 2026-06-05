import { Interval } from "@/Core/geometry";
import { IterUtils } from "Core/utils/index";
import { Grid, GridDimensions } from "./grid";
import { remap_domain_using_iterable } from "./remap_domain";
import { GridArray, Vec3, Vec3_u8 } from "./types";

export class Vec3UInt8Grid extends Grid<Vec3_u8> {
    constructor(dr: GridDimensions, values: Vec3UInt8GridArray) {
        super(dr, values);
    }

    with_new_dimensions(
        new_dimensions: Partial<GridDimensions> = {},
    ): Vec3UInt8Grid {
        return remap_domain_using_iterable(
            this,
            new_dimensions,
            (dims, it) =>
                new Vec3UInt8Grid(
                    dims,
                    Vec3UInt8GridArray.from_iterable(
                        it,
                        dims.lattice_dimensions[0] * dims.lattice_dimensions[1],
                    ),
                ),
        );
    }

    static from_iterable(
        dims: GridDimensions,
        it: Iterable<Vec3>,
    ): Vec3UInt8Grid {
        return new Vec3UInt8Grid(
            dims,
            Vec3UInt8GridArray.from_iterable(
                it,
                dims.lattice_dimensions[0] * dims.lattice_dimensions[1],
            ),
        );
    }
}

export class Vec3UInt8GridArray implements GridArray<Vec3_u8> {
    constructor(public arr: Uint8Array) {}

    length() {
        return this.arr.length;
    }

    as_array() {
        let values: [number, number, number][] = [];
        for (let i = 0; i < this.arr.length; i += 3) {
            values.push([this.arr[i]!, this.arr[i + 1]!, this.arr[i + 2]!]);
        }
        return values;
    }

    get(at: number) {
        return [
            this.arr[at * 3]!,
            this.arr[at * 3 + 1]!,
            this.arr[at * 3 + 2],
        ] as [number, number, number];
    }

    set(at: number, v: Vec3_u8) {
        this.arr[3 * at] = v[0];
        this.arr[3 * at + 1] = v[1];
        this.arr[3 * at + 2] = v[2];
    }

    into_array(): Vec3_u8[] {
        return this.as_array();
    }

    lerp(a: Vec3, b: Vec3, t: number): Vec3_u8 {
        return [
            Math.round(Interval.lerp(a[0], b[0], t)),
            Math.round(Interval.lerp(a[1], b[1], t)),
            Math.round(Interval.lerp(a[2], b[2], t)),
        ] as Vec3_u8;
    }

    [Symbol.iterator](): Iterator<Vec3> {
        const arr_it = this.arr[Symbol.iterator]();
        return {
            next(): IteratorResult<Vec3> {
                let next1 = arr_it.next();
                if (next1.done) return { value: undefined, done: true };

                const value: Vec3 = [
                    next1.value,
                    arr_it.next().value!,
                    arr_it.next().value!,
                ];
                return { value, done: false };
            },
        };
    }

    static from_iterable(it: Iterable<Vec3>, len: number) {
        let res = new Uint8Array(3 * len);

        for (const [i, v] of IterUtils.enumerate(it)) {
            res[3 * i] = v[0];
            res[3 * i + 1] = v[1];
            res[3 * i + 2] = v[2];
        }

        return new Vec3UInt8GridArray(res);
    }
}
