import { Interval, Vector } from "Core/geometry/index";
import { Expect } from "../../expect";

export type Lerp<T> = (a: T, b: T, t: number) => T;

export class Grid<GridType> {
    constructor(
        // x, y, w, h
        public dimensions_ref: [number, number, number, number],
        public lattice_dimensions_ref: [number, number],
        public values_ref: GridType[],
    ) {
        const [w, h] = lattice_dimensions_ref;

        Expect.lazy(() => {
            Expect.that(
                Number.isFinite(dimensions_ref[2]) &&
                    Number.isFinite(dimensions_ref[3]),
                "grid width/height must be finite",
            );
            Expect.that(
                dimensions_ref[2] >= 0,
                "grid width must be non-negative",
            );
            Expect.that(
                dimensions_ref[3] >= 0,
                "grid height must be non-negative",
            );
            Expect.that(w > 0, "grid width must be > 0");
            Expect.that(h > 0, "grid height must be > 0");
            Expect.that(
                values_ref.length === w * h,
                "values length must equal width * height",
            );
        });
    }

    private index_of(x: number, y: number): number {
        const [w] = this.lattice_dimensions_ref;
        return y * w + x;
    }

    set_value_at_lattive_point(x: number, y: number, value: GridType): void {
        this.values_ref[this.index_of(x, y)] = value;
    }

    value_at_lattice_point(x: number, y: number): GridType {
        return Expect.defined(this.values_ref[this.index_of(x, y)]);
    }

    map<U>(f: (value: GridType, x: number, y: number) => U): Grid<U> {
        const [w] = this.lattice_dimensions_ref;

        const new_values = this.values_ref.map((value, i) => {
            const x = i % w;
            const y = Math.floor(i / w);
            return f(value, x, y);
        });

        return new Grid<U>(
            [...this.dimensions_ref],
            [...this.lattice_dimensions_ref],
            new_values,
        );
    }

    map_in_place(f: (value: GridType) => GridType): void {
        for (let i = 0; i < this.values_ref.length; i++) {
            this.values_ref[i] = f(this.values_ref[i]!);
        }
    }

    copy() {
        return new Grid<GridType>(
            [...this.dimensions_ref],
            [...this.lattice_dimensions_ref],
            [...this.values_ref],
        );
    }

    dimensions(): [number, number, number, number] {
        return [...this.dimensions_ref];
    }

    lattice_dimensions(): [number, number] {
        return [...this.lattice_dimensions_ref];
    }

    values(): GridType[] {
        return [...this.values_ref];
    }

    values_2d(): GridType[][] {
        throw new Error();
    }

    remap_domain(new_domain: [number, number, number, number]): Grid<GridType> {
        return new Grid<GridType>(
            new_domain,
            this.lattice_dimensions(),
            this.values(),
        );
    }

    remap_domain_in_place(
        new_domain: [number, number, number, number],
    ): Grid<GridType> {
        this.dimensions_ref = new_domain;
        return this;
    }

    lattice_subgrid(subbox: [number, number, number, number]): Grid<GridType> {
        const [x, y, w, h] = subbox;
        const [grid_w, grid_h] = this.lattice_dimensions_ref;

        Expect.lazy(() => {
            Expect.that(x <= grid_w, "subgrid x out of bounds");
            Expect.that(y <= grid_h, "subgrid y out of bounds");
            Expect.that(x + w <= grid_w, "subgrid width out of bounds");
            Expect.that(y + h <= grid_h, "subgrid height out of bounds");
        });

        const values: GridType[] = [];

        for (let row = y; row < y + h; row++) {
            for (let col = x; col < x + w; col++) {
                values.push(this.value_at_lattice_point(col, row));
            }
        }

        const new_tl = this.vector_at_lattice_point(x, y);
        const new_br = this.vector_at_lattice_point(x + w, y + h);
        return new Grid<GridType>(
            [new_tl.x, new_tl.y, new_br.x - new_tl.x, new_br.y - new_tl.y],
            [w, h],
            values,
        );
    }

    lattice_point_at_vector(v: Vector): [number, number] {
        const [grid_x, grid_y, grid_w, grid_h] = this.dimensions_ref;
        const [w, h] = this.lattice_dimensions_ref;

        const w_remap = Interval.remap([grid_x, grid_x + grid_w], [0, w - 1]);
        const h_remap = Interval.remap([grid_y, grid_y + grid_h], [0, h - 1]);

        const sx = w_remap(v.x);
        const sy = h_remap(v.y);

        return [
            Interval.clamp([0, w - 1], Math.round(sx)),
            Interval.clamp([0, h - 1], Math.round(sy)),
        ];
    }

    vector_at_lattice_point(x: number, y: number): Vector {
        const [grid_x, grid_y, grid_w, grid_h] = this.dimensions_ref;
        const [w, h] = this.lattice_dimensions_ref;

        const w_remap = Interval.remap([0, w - 1], [grid_x, grid_x + grid_w]);
        const h_remap = Interval.remap([0, h - 1], [grid_y, grid_y + grid_h]);

        const sx = w_remap(Interval.clamp([0, w - 1], Math.round(x)));
        const sy = h_remap(Interval.clamp([0, h - 1], Math.round(y)));

        return new Vector(sx, sy);
    }
}
