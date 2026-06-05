import { BooleanGrid } from "./boolean_grid";
import { NumberGrid } from "./number_grid";
import { Uint8Grid } from "./u8_grid";
import { Vec3Grid } from "./vec3_grid";
import { Vec3UInt8Grid } from "./vec3u8_grid";
import { VectorGrid } from "./vector_grid";

export type Vec3 = [number, number, number];

export type u8 = number;
export type Vec3_u8 = [number, number, number];

export type LatticePoint = [number, number];

export interface GridArray<T> extends Iterable<T> {
    length(): number;
    get(offset: number): T;
    set(offset: number, value: T): void;
    into_array(): Array<T>;
    as_array(): Array<T>;
    lerp(a: T, b: T, t: number): T;
}

export type InternalGrid =
    | NumberGrid
    | BooleanGrid
    | Vec3Grid
    | VectorGrid
    | Uint8Grid
    | Vec3UInt8Grid;
