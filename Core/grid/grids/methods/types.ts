import { LatticePoint } from "Core/grid/types";

export type GridWindow<T> = (p: [number, number]) => T;
export type GridWindowFunction<T, S> = (
    v: GridWindow<T>,
    top_left: LatticePoint,
) => S;
