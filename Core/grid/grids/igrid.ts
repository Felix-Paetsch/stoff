import { Vector } from "Core/geometry/vector";
import { GridDimensions, LatticePoint } from "../types";

export interface IGrid<T, S extends string> {
    map_in_place(f: (value: T, v: Vector) => T): void;
    remap_domain_in_place(new_domain: [number, number, number, number]): void;

    type: S;

    dimensions_ref: GridDimensions;
    dimensions(): GridDimensions;

    values(): T[];
    into_values(): T[];
    values_2d(): T[][];

    copy(): IGrid<T, S>;

    set_value_at_lattice_point(p: LatticePoint, value: T): void;
    value_at_lattice_point(p: LatticePoint): T;

    sample_at(v: Vector): T;

    with_new_dimensions(new_dimensions?: Partial<GridDimensions>): IGrid<T, S>;
}
