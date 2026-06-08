import { LatticePoint } from "./map";

export type GridWindow<T> = (p: [number, number]) => T;
export type GridWindowFunction<T, S> = (
    v: GridWindow<T>,
    top_left: LatticePoint,
) => S;
