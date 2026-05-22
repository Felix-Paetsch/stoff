import { Interval } from "Core/geometry/index";
import * as Expect from "../expect";

export type Lerp<T> = (a: T, b: T, t: number) => T;

export class Grid<GridType> {
    constructor(
        // x, y, w, h
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

    sample_at(x: number, y: number, lerp: Lerp<GridType>): GridType {
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

        const w_remap = Interval.remap([grid_x, grid_x + grid_w], [0, w - 1]);
        const h_remap = Interval.remap([grid_y, grid_y + grid_h], [0, h - 1]);

        const sx = w_remap(x);
        const sy = h_remap(y);

        const x0 = Interval.clamp([0, w - 1], Math.floor(sx));
        const y0 = Interval.clamp([0, h - 1], Math.floor(sy));
        const x1 = Interval.clamp([0, w - 1], Math.ceil(sx));
        const y1 = Interval.clamp([0, h - 1], Math.ceil(sy));

        const tx = sx - x0;
        const ty = sy - y0;

        const v00 = this.value_at(x0, y0);
        const v10 = this.value_at(x1, y0);
        const v01 = this.value_at(x0, y1);
        const v11 = this.value_at(x1, y1);

        const a = lerp(v00, v10, tx);
        const b = lerp(v01, v11, tx);

        return lerp(a, b, ty);
    }

    resample(
        new_dimensions: [number, number, number, number],
        new_sample_spacing: [number, number],
        lerp: Lerp<GridType>,
    ): Grid<GridType> {
        const [new_w, new_h] = new_sample_spacing;

        Expect.lazy(() => {
            Expect.that(new_w > 0, "new sample width must be > 0");
            Expect.that(new_h > 0, "new sample height must be > 0");
        });

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
}
