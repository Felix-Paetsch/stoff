import { Matrix, Vector } from "@/Core/geometry";

import { IGrid } from "./grids/igrid";
import { grid_from_array } from "./grids/index";
import { map_grid } from "./grids/methods/map";

export type LatticePoint = [number, number];

export type GridDimensions = {
    lattice_dimensions: [number, number];
    domain_dimensions: [number, number, number, number];
};
export type IntoGridDimensions =
    | GridDimensions
    | {
          dimensions_ref: GridDimensions;
      };
export type PartialGridDimensions =
    | null
    | Partial<GridDimensions>
    | [number, number]
    | [number, number, number, number];

export type Vec3 = [number, number, number];

export type u8 = number;

export type GridTypeName = "number" | "boolean" | "vec3" | "vector" | "matrix";

export type GridValueType<N extends GridTypeName> = N extends "number"
    ? number
    : N extends "boolean"
      ? boolean
      : N extends "vec3"
        ? Vec3
        : N extends "vector"
          ? Vector
          : N extends "matrix"
            ? Matrix
            : never;

export type NumberGrid = IGrid<number, "number">;

export type Vec3Grid = IGrid<Vec3, "vec3">;

export type VectorGrid = IGrid<Vector, "vector">;
export type MatrixGrid = IGrid<Matrix, "matrix">;
export type BooleanGrid = IGrid<boolean, "boolean">;

export type InternalGrid =
    | NumberGrid
    | Vec3Grid
    | VectorGrid
    | BooleanGrid
    | MatrixGrid;

export function split_vec3_grid(
    g: Vec3Grid,
): [NumberGrid, NumberGrid, NumberGrid] {
    return [
        map_grid("number", g, (a) => a[0]),
        map_grid("number", g, (a) => a[1]),
        map_grid("number", g, (a) => a[2]),
    ] as [NumberGrid, NumberGrid, NumberGrid];
}

export function join_number_grids(
    a: NumberGrid,
    b: NumberGrid,
    c: NumberGrid,
): Vec3Grid {
    const dims = a.dimensions();
    const res: Vec3[] = [];

    for (let w = 0; w < dims.lattice_dimensions[0]; w++) {
        for (let h = 0; h < dims.lattice_dimensions[1]; h++) {
            res.push([
                a.value_at_lattice_point([w, h]),
                b.value_at_lattice_point([w, h]),
                c.value_at_lattice_point([w, h]),
            ]);
        }
    }

    return grid_from_array("vec3", a.dimensions(), res);
}
