import { Vector } from "Core/geometry/vector";
import { Grid } from "./grid";

export type NumberGrid = Grid<number>;
export type VectorGrid = Grid<Vector>;

export type InternalGridType = NumberGrid | VectorGrid;

export function internal_is_number_grid(g: InternalGridType): g is NumberGrid {
    const val = g.values_by_ref()[0];
    if (!val) return true;
    return typeof val == "number";
}

export function internal_is_vector_grid(g: InternalGridType): g is VectorGrid {
    const val = g.values_by_ref()[0];
    if (!val) return true;
    return val instanceof Vector;
}

export function is_number_grid(g: Grid<any>): g is NumberGrid {
    return g.values_by_ref().every((x) => typeof x == "number");
}

export function is_vector_grid(g: Grid<any>): g is VectorGrid {
    return g.values_by_ref().every((x) => x instanceof Vector);
}
