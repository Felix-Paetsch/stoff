import { Expect } from "Core/expect";
import { Interval, Vector } from "Core/geometry/index";
import { EPS } from "Core/numerics/eps";
import { IterUtils } from "Core/utils/index";
import { GridArray, LatticePoint } from "./types";

export type GridDimensions = {
    lattice_dimensions: [number, number];
    domain_dimensions: [number, number, number, number];
};

export abstract class Grid<T, S extends GridArray<T> = GridArray<T>> {
    constructor(
        // x, y, w, h
        public dimensions_ref: GridDimensions,
        public values_ref: S,
    ) {
        const [w, h] = dimensions_ref.lattice_dimensions;

        Expect.lazy(() => {
            Expect.that(
                Number.isFinite(dimensions_ref.domain_dimensions[2]) &&
                    Number.isFinite(dimensions_ref.domain_dimensions[3]),
                "grid width/height must be finite",
            );
            Expect.that(
                dimensions_ref.domain_dimensions[2] >= 0,
                "grid width must be non-negative",
            );
            Expect.that(
                dimensions_ref.domain_dimensions[3] >= 0,
                "grid height must be non-negative",
            );
            Expect.that(w > 0, "grid width must be > 0");
            Expect.that(h > 0, "grid height must be > 0");
            Expect.that(
                values_ref.length() === w * h,
                "values length must equal width * height",
            );
        });
    }

    complete_partial_subgrid_dimensions(
        dims: Partial<GridDimensions>,
    ): GridDimensions {
        if (!dims.domain_dimensions) {
            dims.domain_dimensions = this.dimensions_ref.domain_dimensions;
        }

        const dd = dims.domain_dimensions!;
        const tdd = this.domain_dimensions()!;
        Expect.that(
            EPS.less_than_or_eq(dd[0], tdd[0]) &&
                EPS.less_than_or_eq(dd[1], tdd[1]) &&
                EPS.less_than_or_eq(dd[0] + dd[2], tdd[0] + tdd[2]) &&
                EPS.less_than_or_eq(dd[1] + dd[3], tdd[1] + tdd[3]),
            "New dimensions must be a subspace of old dimensions",
        );
        Expect.that(
            dd[2] > 0 && dd[3] > 0,
            "New dimensions must have width, height > 0",
        );

        if (!dims.lattice_dimensions) {
            let w_frac = tdd[2] / dd[2];
            let h_frac = tdd[3] / dd[3];

            dims.lattice_dimensions = [
                Math.max(
                    Math.ceil(
                        w_frac * this.dimensions_ref.lattice_dimensions[0],
                    ),
                    2,
                ),
                Math.max(
                    Math.ceil(
                        h_frac * this.dimensions_ref.lattice_dimensions[1],
                    ),
                    2,
                ),
            ];
        }

        return dims as GridDimensions;
    }

    abstract with_new_dimensions(new_domain: Partial<GridDimensions>): Grid<T>;

    lazy_with_new_dimensions(new_domain_: Partial<GridDimensions>): Grid<T> {
        const new_domain =
            this.complete_partial_subgrid_dimensions(new_domain_);
        if (Grid.dimensions_agree(new_domain, this.dimensions_ref)) {
            return this;
        }

        return this.with_new_dimensions(new_domain);
    }

    resample(new_lattice_dim: [number, number]): Grid<T> {
        return this.with_new_dimensions({
            domain_dimensions: this.dimensions_ref.domain_dimensions,
            lattice_dimensions: new_lattice_dim,
        });
    }

    interpolate(
        values: {
            tl: T;
            tr: T;
            bl: T;
            br: T;
        },
        progress: [number, number],
    ): T {
        return this.values_ref.lerp(
            this.values_ref.lerp(values.tl, values.tr, progress[0]),
            this.values_ref.lerp(values.bl, values.br, progress[0]),
            progress[1],
        );
    }

    map_in_place(f: (value: T) => T): void {
        for (let i = 0; i < this.values_ref.length(); i++) {
            this.values_ref.set(i, f(this.values_ref.get(i)!));
        }
    }

    map<S>(fn: (value: T, vec: Vector) => S): Iterable<S> {
        const [w] = this.dimensions_ref.lattice_dimensions;

        return IterUtils.map(this.values_ref, (v, i) => {
            const x = i % w;
            const y = Math.floor(i / w);
            return fn(v, this.vector_at_lattice_point([x, y]));
        });
    }

    // copy() {
    //     return Grid.from(this.dimensions(), [...this.values_ref]);
    // }

    lattice_point_index_in_values(p: LatticePoint): number {
        const [w] = this.dimensions_ref.lattice_dimensions;
        return p[1] * w + p[0];
    }

    set_value_at_lattice_point(p: LatticePoint, value: T): void {
        this.values_ref.set(this.lattice_point_index_in_values(p), value);
    }

    value_at_lattice_point(p: LatticePoint): T {
        return this.values_ref.get(this.lattice_point_index_in_values(p));
    }

    domain_dimensions(): [number, number, number, number] {
        return [...this.dimensions_ref.domain_dimensions];
    }

    lattice_dimensions(): [number, number] {
        return [...this.dimensions_ref.lattice_dimensions];
    }

    dimensions(): GridDimensions {
        return {
            domain_dimensions: this.domain_dimensions(),
            lattice_dimensions: this.lattice_dimensions(),
        };
    }

    values(): T[] {
        return this.values_ref.as_array();
    }

    values_2d(): T[][] {
        const [w, h] = this.dimensions_ref.lattice_dimensions;
        const result: T[][] = [];

        for (let y = 0; y < h; y++) {
            const row: T[] = [];
            for (let x = 0; x < w; x++) {
                row.push(this.values_ref.get(y * w + x)!);
            }
            result.push(row);
        }

        return result;
    }

    remap_domain_in_place(new_domain: [number, number, number, number]) {
        this.dimensions_ref.domain_dimensions = new_domain;
        return this;
    }

    // remap_domain(new_domain: [number, number, number, number]): typeof this {
    //     return Grid.from(
    //         {
    //             domain_dimensions: new_domain,
    //             lattice_dimensions: this.lattice_dimensions(),
    //         },
    //         this.values(),
    //     );
    // }
    //
    // lattice_subgrid(subbox: [number, number, number, number]): typeof this {
    //     const [x, y, w, h] = subbox;
    //     const [grid_w, grid_h] = this.dimensions_ref.lattice_dimensions;
    //
    //     Expect.lazy(() => {
    //         Expect.that(x <= grid_w, "subgrid x out of bounds");
    //         Expect.that(y <= grid_h, "subgrid y out of bounds");
    //         Expect.that(x + w <= grid_w, "subgrid width out of bounds");
    //         Expect.that(y + h <= grid_h, "subgrid height out of bounds");
    //     });
    //
    //     const values: T[] = [];
    //
    //     for (let row = y; row < y + h; row++) {
    //         for (let col = x; col < x + w; col++) {
    //             values.push(this.value_at_lattice_point([col, row]));
    //         }
    //     }
    //
    //     const new_tl = this.vector_at_lattice_point([x, y]);
    //     const new_br = this.vector_at_lattice_point([x + w, y + h]);
    //     return Grid.from(
    //         {
    //             domain_dimensions: [
    //                 new_tl.x,
    //                 new_tl.y,
    //                 new_br.x - new_tl.x,
    //                 new_br.y - new_tl.y,
    //             ],
    //             lattice_dimensions: [w, h],
    //         },
    //         values,
    //     );
    // }

    lattice_point_at_vector(v: Vector): [number, number] {
        const [grid_x, grid_y, grid_w, grid_h] =
            this.dimensions_ref.domain_dimensions;
        const [w, h] = this.dimensions_ref.lattice_dimensions;

        const w_remap = Interval.remap([grid_x, grid_x + grid_w], [0, w - 1]);
        const h_remap = Interval.remap([grid_y, grid_y + grid_h], [0, h - 1]);

        const sx = w_remap(v.x);
        const sy = h_remap(v.y);

        return [
            Interval.clamp([0, w - 1], Math.round(sx)),
            Interval.clamp([0, h - 1], Math.round(sy)),
        ];
    }

    vector_at_lattice_point(p: LatticePoint): Vector {
        const [grid_x, grid_y, grid_w, grid_h] =
            this.dimensions_ref.domain_dimensions;
        const [w, h] = this.dimensions_ref.lattice_dimensions;

        const w_remap = Interval.remap([0, w - 1], [grid_x, grid_x + grid_w]);
        const h_remap = Interval.remap([0, h - 1], [grid_y, grid_y + grid_h]);

        const sx = w_remap(Interval.clamp([0, w - 1], Math.round(p[0])));
        const sy = h_remap(Interval.clamp([0, h - 1], Math.round(p[1])));

        return new Vector(sx, sy);
    }

    same_dimensions(other: Grid<any>) {
        return Grid.dimensions_agree(this.dimensions_ref, other.dimensions_ref);
    }

    static dimensions_agree(l: GridDimensions, o: GridDimensions): boolean {
        let ld = l.lattice_dimensions;
        let ldo = o.lattice_dimensions;

        let dd = l.domain_dimensions;
        let ddo = o.domain_dimensions;

        return (
            ld[0] == ldo[0] &&
            ld[1] == ldo[1] &&
            Math.abs(dd[0] - ddo[0]) < EPS.tiny &&
            Math.abs(dd[1] - ddo[1]) < EPS.tiny &&
            Math.abs(dd[2] - ddo[2]) < EPS.tiny &&
            Math.abs(dd[3] - ddo[3]) < EPS.tiny
        );
    }

    // resample(new_dimensions: GridDimensions): typeof this {
    //     const [new_w, new_h] = new_dimensions.lattice_dimensions;
    //
    //     Expect.lazy(() => {
    //         Expect.that(new_w > 0, "new sample width must be > 0");
    //         Expect.that(new_h > 0, "new sample height must be > 0");
    //     });
    //
    //     const [x, y, w, h] = new_dimensions.domain_dimensions;
    //     const values: T[] = [];
    //
    //     for (let j = 0; j < new_h; j++) {
    //         const fy = new_h === 1 ? 0 : j / (new_h - 1);
    //         const abs_y = y + fy * h;
    //
    //         for (let i = 0; i < new_w; i++) {
    //             const fx = new_w === 1 ? 0 : i / (new_w - 1);
    //             const abs_x = x + fx * w;
    //             values.push(this.sample_at(new Vector(abs_x, abs_y)));
    //         }
    //     }
    //
    //     return Grid.from(new_dimensions, values);
    // }

    sample_at(v: Vector): T {
        const [x, y] = v.to_array();
        const [grid_x, grid_y, grid_w, grid_h] =
            this.dimensions_ref.domain_dimensions;
        const [w, h] = this.dimensions_ref.lattice_dimensions;

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

        const v00 = this.value_at_lattice_point([x0, y0]);
        const v10 = this.value_at_lattice_point([x1, y0]);
        const v01 = this.value_at_lattice_point([x0, y1]);
        const v11 = this.value_at_lattice_point([x1, y1]);

        return this.interpolate(
            {
                tl: v00,
                tr: v10,
                bl: v01,
                br: v11,
            },
            [tx, ty],
        );
    }

    // static from_function<T>(
    //     dimensions: GridDimensions,
    //     fn: (v: Vector) => T,
    // ): Grid<T> {
    //     const [x, y, w, h] = dimensions.domain_dimensions;
    //     const [grid_w, grid_h] = dimensions.lattice_dimensions;
    //
    //     const values: T[] = [];
    //
    //     for (let j = 0; j < grid_h; j++) {
    //         const fy = grid_h === 1 ? 0.5 : j / (grid_h - 1);
    //         const abs_y = y + fy * h;
    //
    //         for (let i = 0; i < grid_w; i++) {
    //             const fx = grid_w === 1 ? 0.5 : i / (grid_w - 1);
    //             const abs_x = x + fx * w;
    //
    //             values.push(fn(new Vector(abs_x, abs_y)) as T);
    //         }
    //     }
    //
    //     return Grid.from(dimensions, values) as any;
    // }
    //
    // static with_same_dimensions<T>(g: Grid<any>, fn: (v: Vector) => T): Grid<T> {
    //     return Grid.from_function(g.dimensions(), fn);
    // }
}
