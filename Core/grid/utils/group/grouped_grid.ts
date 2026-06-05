import { Vector } from "Core/geometry/vector";
import { Grid, GridArray, GridDimensions, JSArrayGrid } from "../../grids/";

// This class should never be directly constructed
export class GroupedGrid<T extends any[]> extends Grid<T, GroupedGridArray<T>> {
    constructor(dim: GridDimensions, values: GroupedGridArray<T>) {
        super(dim, values);
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
            this.values_ref.lerp,
        );
    }
}

export class GroupedGridArray<T extends any[]> implements GridArray<T> {
    constructor(public gridArrays: GridArray<any>[]) {}

    length() {
        return this.gridArrays[0]!.length();
    }

    as_array() {
        let values: T[] = [];
        for (let i = 0; i < this.length(); i += 1) {
            values.push(this.get(i));
        }
        return values;
    }

    get(at: number) {
        return this.gridArrays.map((g) => g.get(at)) as T;
    }

    set(at: number, v: T) {
        for (let i = 0; i < v.length; i++) {
            this.gridArrays[i]!.set(at, v[i]);
        }
    }

    into_array(): T[] {
        return this.as_array();
    }

    lerp(a: T, b: T, t: number): T {
        let res: any[] = [];
        for (let i = 0; i < a.length; i++) {
            res.push(this.gridArrays[i]!.lerp(a[i]!, b[i]!, t));
        }

        return res as T;
    }

    [Symbol.iterator](): Iterator<T> {
        const arr_its = this.gridArrays.map((a) => a[Symbol.iterator]());

        return {
            next(): IteratorResult<T> {
                let nexts = arr_its.map((a) => a.next());
                if (nexts[0]!.done) return { value: undefined, done: true };

                return { value: nexts.map((v) => v.value) as T, done: false };
            },
        };
    }
}
