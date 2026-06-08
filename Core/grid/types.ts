import { Vector } from "Core/geometry/vector";
import { IGrid } from "./grids/igrid";

export type LatticePoint = [number, number];

export type GridDimensions = {
    lattice_dimensions: [number, number];
    domain_dimensions: [number, number, number, number];
};

export type PartialGridDimensions =
    | null
    | Partial<GridDimensions>
    | [number, number]
    | [number, number, number, number];

export type Vec3 = [number, number, number];
export type Vec3U8 = [number, number, number];
export type u8 = number;

export type GridTypeName =
    | "u8"
    | "f64"
    | "boolean"
    | "vec3"
    | "vec3u8"
    | "vector";

export type GridValueType<N extends GridTypeName> = N extends "u8"
    ? number
    : N extends "f64"
      ? number
      : N extends "boolean"
        ? boolean
        : N extends "vec3"
          ? Vec3
          : N extends "vec3u8"
            ? Vec3U8
            : N extends "vector"
              ? Vector
              : never;

export type NumberGrid = IGrid<number, "f64">;
export type UInt8Grid = IGrid<u8, "u8">;
export type Vec3Grid = IGrid<Vec3, "vec3">;
export type Vec3UInt8Grid = IGrid<Vec3U8, "vec3u8">;
export type VectorGrid = IGrid<Vector, "vector">;
export type BooleanGrid = IGrid<boolean, "boolean">;

export type InternalGrid =
    | NumberGrid
    | UInt8Grid
    | Vec3Grid
    | Vec3UInt8Grid
    | VectorGrid
    | BooleanGrid;
