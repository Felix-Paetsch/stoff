import { LatticePoint } from "ProcedualArt/primitives/grid/types";

// The top left is X0,Y0
export type GridWindow<T> = (p: [number, number]) => T;
export type GridWindowFunction<T, S> = (
    v: GridWindow<T>,
    top_left: LatticePoint,
) => S;
