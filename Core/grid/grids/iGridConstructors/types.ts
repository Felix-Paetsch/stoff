import { GridDimensions } from "../../types";
import { IGrid } from "../igrid";

export type IGridConstructor<T, S extends string> = (
    d: GridDimensions,
    v: T[],
) => IGrid<T, S>;

export interface GridArray<T> extends Iterable<T> {
    length(): number;
    get(offset: number): T;
    set(offset: number, value: T): void;
    into_array(): Array<T>;
    as_array(): Array<T>;
    lerp(a: T, b: T, t: number): T;
}
