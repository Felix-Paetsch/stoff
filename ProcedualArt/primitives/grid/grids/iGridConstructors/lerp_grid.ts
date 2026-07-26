import { Expect } from "@/Core/expect";
import { Vector } from "@/Core/geometry";
import { Interval } from "@/Core/numerics";
import { GridDimensions, LatticePoint } from "../../types";
import { IGrid } from "../igrid";
import { complete_partial_subgrid_dimensions } from "../methods/dimensions";

export class LerpGrid<T, S extends string> implements IGrid<T, S> {
    constructor(
        public dimensions_ref: GridDimensions,
        private _values_ref: T[],
        public lerp: (a: T, b: T, t: number) => T,
        public type: S,
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
                _values_ref.length === w * h,
                "values length must equal width * height",
            );
        });
    }

    into_values(): T[] {
        return this._values_ref;
    }

    values_ref(): T[] {
        return this._values_ref;
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
        return this.lerp(
            this.lerp(values.tl, values.tr, progress[0]),
            this.lerp(values.bl, values.br, progress[0]),
            progress[1],
        );
    }

    map_in_place(f: (value: T, v: Vector) => T): void {
        const [w, h] = this.dimensions_ref.lattice_dimensions;
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                let i = y * w + x;
                this._values_ref[i] = f(
                    this._values_ref[y * w + x]!,
                    this.vector_at_lattice_point([x, y]),
                );
            }
        }
    }

    lattice_point_index_in_values(p: LatticePoint): number {
        const [w] = this.dimensions_ref.lattice_dimensions;
        return p[1] * w + p[0];
    }

    set_value_at_lattice_point(p: LatticePoint, value: T): void {
        this._values_ref[this.lattice_point_index_in_values(p)] = value;
    }

    value_at_lattice_point(p: LatticePoint): T {
        return this._values_ref[this.lattice_point_index_in_values(p)]!;
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
        return [...this._values_ref];
    }

    values_2d(): T[][] {
        const [w, h] = this.dimensions_ref.lattice_dimensions;
        const result: T[][] = [];

        for (let y = 0; y < h; y++) {
            const row: T[] = [];
            for (let x = 0; x < w; x++) {
                row.push(this._values_ref[y * w + x]!);
            }
            result.push(row);
        }

        return result;
    }

    remap_domain_in_place(
        new_domain:
            | [number, number, number, number]
            | Partial<{
                  x: number;
                  y: number;
                  width: number;
                  height: number;
              }>,
    ) {
        if (Array.isArray(new_domain)) {
            this.dimensions_ref.domain_dimensions = [...new_domain];
            return;
        }

        const [_, __, old_width, old_height] =
            this.dimensions_ref.domain_dimensions;

        const x = new_domain.x ?? 0;
        const y = new_domain.y ?? 0;

        let width = new_domain.width;
        let height = new_domain.height;

        if (width === undefined && height === undefined) {
            width = old_width;
            height = old_height;
        } else if (width === undefined) {
            width =
                old_height === 0
                    ? old_width
                    : (height! * old_width) / old_height;
        } else if (height === undefined) {
            height =
                old_width === 0 ? old_height : (width * old_height) / old_width;
        }

        this.dimensions_ref.domain_dimensions = [x, y, width!, height!];
    }

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

    copy(): LerpGrid<T, S> {
        return new LerpGrid(
            this.dimensions(),
            this.values(),
            this.lerp,
            this.type,
        );
    }

    with_new_dimensions(
        new_dimensions_: Partial<GridDimensions> = {},
    ): LerpGrid<T, S> {
        const new_dimensions = complete_partial_subgrid_dimensions(
            new_dimensions_,
            this,
        );
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

        return new LerpGrid(new_dimensions, new_values, this.lerp, this.type);
    }
}
