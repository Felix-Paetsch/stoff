import { Interval } from "Core/geometry/index";
import { Vector } from "Core/geometry/vector";
import * as Expect from "../expect";
import * as Types from "../types";
import { internal_is_number_grid } from "./types";

export type Lerp<T> = (a: T, b: T, t: number) => T;
type LerpImplRestArgument<GridType> = Types.AsRestParameter<
    Types.BaseAndIfThenAlso<
        Lerp<GridType>,
        Types.IsUnionMember<GridType, number | Vector>,
        undefined
    >
>;

export class Grid<GridType> {
    constructor(
        private _dimensions: [number, number, number, number],
        private _grid_dimensions: [number, number],
        private _values: GridType[],
    ) {
        const [w, h] = _grid_dimensions;

        Expect.lazy(() => {
            Expect.that(
                Number.isFinite(_dimensions[2]) &&
                    Number.isFinite(_dimensions[3]),
                "grid width/height must be finite",
            );
            Expect.that(_dimensions[2] >= 0, "grid width must be non-negative");
            Expect.that(
                _dimensions[3] >= 0,
                "grid height must be non-negative",
            );
            Expect.that(w > 0, "grid width must be > 0");
            Expect.that(h > 0, "grid height must be > 0");
            Expect.that(
                _values.length === w * h,
                "values length must equal width * height",
            );
        });
    }

    values_by_ref(): GridType[] {
        return this._values;
    }

    private index_of(x: number, y: number): number {
        const [w] = this._grid_dimensions;
        return y * w + x;
    }

    set_value_at(x: number, y: number, value: GridType): void {
        this._values[this.index_of(x, y)] = value;
    }

    value_at(x: number, y: number): GridType {
        return Expect.defined(this._values[this.index_of(x, y)]);
    }

    map<U>(f: (x: number, y: number, value: GridType) => U): Grid<U> {
        const [w] = this._grid_dimensions;

        const new_values = this._values.map((value, i) => {
            const x = i % w;
            const y = Math.floor(i / w);
            return f(x, y, value);
        });

        return new Grid<U>(
            [...this._dimensions],
            [...this._grid_dimensions],
            new_values,
        );
    }

    map_in_place(f: (value: GridType) => GridType): void {
        for (let i = 0; i < this._values.length; i++) {
            this._values[i] = f(this._values[i]!);
        }
    }

    copy() {
        return new Grid<GridType>(
            [...this._dimensions],
            [...this._grid_dimensions],
            [...this._values],
        );
    }

    dimensions(): [number, number, number, number] {
        return [...this._dimensions];
    }

    grid_dimensions(): [number, number] {
        return [...this._grid_dimensions];
    }

    remap_domain(new_domain: [number, number, number, number]): Grid<GridType> {
        return new Grid<GridType>(
            new_domain,
            [...this._grid_dimensions],
            [...this._values],
        );
    }

    subgrid(subbox: [number, number, number, number]): Grid<GridType> {
        const [x, y, w, h] = subbox;
        const [grid_w, grid_h] = this._grid_dimensions;

        Expect.lazy(() => {
            Expect.that(x <= grid_w, "subgrid x out of bounds");
            Expect.that(y <= grid_h, "subgrid y out of bounds");
            Expect.that(x + w <= grid_w, "subgrid width out of bounds");
            Expect.that(y + h <= grid_h, "subgrid height out of bounds");
        });

        const values: GridType[] = [];

        for (let row = y; row < y + h; row++) {
            for (let col = x; col < x + w; col++) {
                values.push(this.value_at(col, row));
            }
        }

        return new Grid<GridType>([...this._dimensions], [w, h], values);
    }

    sample_at(
        x: number,
        y: number,
        ...lerp_impl: LerpImplRestArgument<GridType>
    ): GridType {
        const [grid_x, grid_y, grid_w, grid_h] = this._dimensions;
        const [w, h] = this._grid_dimensions;

        Expect.lazy(() => {
            Expect.that(
                grid_w >= 0,
                "grid width in world space must be non-negative",
            );
            Expect.that(
                grid_h >= 0,
                "grid height in world space must be non-negative",
            );
            Expect.that(
                x >= grid_x && x <= grid_x + grid_w,
                "x is outside grid bounds",
            );
            Expect.that(
                y >= grid_y && y <= grid_y + grid_h,
                "y is outside grid bounds",
            );
        });

        const nx = grid_w === 0 ? 0 : (x - grid_x) / grid_w;
        const ny = grid_h === 0 ? 0 : (y - grid_y) / grid_h;

        const sx = nx * Math.max(w - 1, 0);
        const sy = ny * Math.max(h - 1, 0);

        const x0 = Math.floor(sx);
        const y0 = Math.floor(sy);
        const x1 = Math.min(x0 + 1, w - 1);
        const y1 = Math.min(y0 + 1, h - 1);

        const tx = sx - x0;
        const ty = sy - y0;

        const v00 = this.value_at(x0, y0);
        const v10 = this.value_at(x1, y0);
        const v01 = this.value_at(x0, y1);
        const v11 = this.value_at(x1, y1);

        const lerp = get_lerp_implementation(this, ...lerp_impl);
        const a = lerp(v00, v10, tx);
        const b = lerp(v01, v11, tx);

        return lerp(a, b, ty);
    }

    resample(
        new_dimensions: [number, number, number, number],
        new_sample_spacing: [number, number],
        ...lerp_impl: LerpImplRestArgument<GridType>
    ): Grid<GridType> {
        const [new_w, new_h] = new_sample_spacing;

        Expect.lazy(() => {
            Expect.that(new_w > 0, "new sample width must be > 0");
            Expect.that(new_h > 0, "new sample height must be > 0");
        });

        const lerp = get_lerp_implementation(this, ...lerp_impl);

        const [x, y, w, h] = new_dimensions;
        const values: GridType[] = [];

        for (let j = 0; j < new_h; j++) {
            const fy = new_h === 1 ? 0 : j / (new_h - 1);
            const abs_y = y + fy * h;

            for (let i = 0; i < new_w; i++) {
                const fx = new_w === 1 ? 0 : i / (new_w - 1);
                const abs_x = x + fx * w;
                values.push(this.sample_at(abs_x, abs_y, lerp));
            }
        }

        return new Grid<GridType>(new_dimensions, [new_w, new_h], values);
    }

    static from_function<GridType>(
        dimensions: [number, number, number, number],
        grid_dimensions: [number, number],
        fn: (pos: Vector) => GridType,
    ): Grid<GridType> {
        const [x, y, w, h] = dimensions;
        const [grid_w, grid_h] = grid_dimensions;

        const values: GridType[] = [];

        for (let j = 0; j < grid_h; j++) {
            const fy = grid_h === 1 ? 0.5 : j / (grid_h - 1);
            const abs_y = y + fy * h;

            for (let i = 0; i < grid_w; i++) {
                const fx = grid_w === 1 ? 0.5 : i / (grid_w - 1);
                const abs_x = x + fx * w;

                values.push(fn(new Vector(abs_x, abs_y)));
            }
        }

        return new Grid<GridType>(dimensions, grid_dimensions, values);
    }
}

function get_lerp_implementation<GridType>(
    g: Grid<GridType>,
    ...provided_implementation: LerpImplRestArgument<GridType>
): Lerp<GridType> {
    let impl = provided_implementation[0];
    if (impl) return impl;

    if (internal_is_number_grid(g as any)) {
        return Interval.lerp as any;
    } else {
        return Vector.lerp as any;
    }
}
