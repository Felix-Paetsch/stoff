import { Vector } from "Core/geometry/vector";
import { BooleanGrid } from "./boolean_grid";
import { NumberGrid } from "./number_grid";
import { Vec3Grid } from "./vec3_grid";
import { VectorGrid } from "./vector_grid";

export type Vec3 = [number, number, number];
export type GridValue = Vector | number | boolean | Vec3;
export type GridValueTypeUnionUtil = Vector | number | [boolean] | Vec3;

export function is_vector(g: GridValue): g is Vector {
    return g instanceof Vector;
}

export function is_number(g: GridValue): g is number {
    return typeof g == "number";
}

export function is_boolean(g: GridValue): g is boolean {
    return typeof g == "boolean";
}

export function is_vec3(g: GridValue): g is [number, number, number] {
    return Array.isArray(g);
}

export type AssociatedGrid<v extends GridValue> = v extends Vector
    ? VectorGrid
    : v extends number
      ? NumberGrid
      : v extends boolean
        ? BooleanGrid
        : v extends Vec3
          ? Vec3Grid
          : never;

export type InternalGrid = BooleanGrid | NumberGrid | Vec3Grid | VectorGrid;

export type LatticePoint = [number, number];
