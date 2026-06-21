import { Vector } from "Core/geometry/vector";
import { GridDimensions, LatticePoint } from "Core/grid/types";
import { IGrid } from "../igrid";
import {
    complete_partial_subgrid_dimensions,
    lazy_with_new_dimensions,
    vector_at_lattice_point,
} from "./dimensions";

export function group<S>(
    dimensions: GridDimensions,
    g: IGrid<S, any>,
): IGrid<[S], "group">;
export function group<S, T>(
    dimensions: GridDimensions,
    g1: IGrid<S, any>,
    g2: IGrid<T, any>,
): IGrid<[S, T], "group">;
export function group<S, T, U>(
    dimensions: GridDimensions,
    g1: IGrid<S, any>,
    g2: IGrid<T, any>,
    g3: IGrid<U, any>,
): IGrid<[S, T, U], "group">;
export function group<S, T, U, V>(
    dimensions: GridDimensions,
    g1: IGrid<S, any>,
    g2: IGrid<T, any>,
    g3: IGrid<U, any>,
    g4: IGrid<V, any>,
): IGrid<[S, T, U, V], "group">;
export function group<S, T, U, V, W>(
    dimensions: GridDimensions,
    g1: IGrid<S, any>,
    g2: IGrid<T, any>,
    g3: IGrid<U, any>,
    g4: IGrid<V, any>,
    g5: IGrid<W, any>,
): IGrid<[S, T, U, V, W], "group">;
export function group<S, T, U, V, W, X>(
    dimensions: GridDimensions,
    g1: IGrid<S, any>,
    g2: IGrid<T, any>,
    g3: IGrid<U, any>,
    g4: IGrid<V, any>,
    g5: IGrid<W, any>,
    g6: IGrid<X, any>,
): IGrid<[S, T, U, V, W, X], "group">;
export function group<A>(
    dimensions: GridDimensions,
    ...grids: IGrid<A, any>[]
): IGrid<A[], "group">;
export function group<A>(
    dimensions: GridDimensions,
    ...grids: IGrid<A, any>[]
): IGrid<A[], "group"> {
    return new GroupGrid(dimensions, grids);
}

class GroupGrid<A> implements IGrid<A[], "group"> {
    public grids: IGrid<A, any>[];
    public type = "group" as const;

    constructor(
        public dimensions_ref: GridDimensions,
        grids: IGrid<A, any>[],
    ) {
        this.grids = grids.map((g) =>
            lazy_with_new_dimensions(dimensions_ref, g),
        );
    }

    into_values(): A[][] {
        return this.values();
    }

    values_ref(): A[][] {
        return this.values();
    }

    map_in_place(f: (value: A[], v: Vector) => A[]): void {
        const [w, h] = this.dimensions_ref.lattice_dimensions;
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                let p: LatticePoint = [x, y];

                let res: A[] = f(
                    this.value_at_lattice_point(p),
                    vector_at_lattice_point(this.dimensions_ref, p),
                );

                this.set_value_at_lattice_point(p, res);
            }
        }
    }

    set_value_at_lattice_point(p: LatticePoint, value: A[]): void {
        for (let i = 0; i < value.length; i++) {
            this.grids[i]!.set_value_at_lattice_point(p, value[i]!);
        }
    }

    value_at_lattice_point(p: LatticePoint): A[] {
        return this.grids.map((g) => g.value_at_lattice_point(p));
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

    values(): A[][] {
        let res: A[][] = [];
        const [w, h] = this.dimensions_ref.lattice_dimensions;

        for (let x = 0; x < w; x++) {
            for (let y = 0; y < h; y++) {
                res.push(this.value_at_lattice_point([x, y]));
            }
        }

        return res;
    }

    values_2d(): A[][][] {
        let res: A[][][] = [];
        const [w, h] = this.dimensions_ref.lattice_dimensions;

        for (let x = 0; x < w; x++) {
            let row: A[][] = [];
            for (let y = 0; y < h; y++) {
                row.push(this.value_at_lattice_point([x, y]));
            }
            res.push(row);
        }

        return res;
    }

    remap_domain_in_place(new_domain: [number, number, number, number]) {
        this.dimensions_ref.domain_dimensions = new_domain;
        return this;
    }

    sample_at(v: Vector): A[] {
        return this.grids.map((g) => g.sample_at(v));
    }

    copy(): GroupGrid<A> {
        return new GroupGrid(
            this.dimensions(),
            this.grids.map((g) => g.copy()),
        );
    }

    with_new_dimensions(
        new_dimensions_: Partial<GridDimensions> = {},
    ): GroupGrid<A> {
        const complete = complete_partial_subgrid_dimensions(
            new_dimensions_,
            this.grids[0]!,
        );
        return new GroupGrid(
            complete,
            this.grids.map((g) => g.with_new_dimensions(complete)),
        );
    }
}
