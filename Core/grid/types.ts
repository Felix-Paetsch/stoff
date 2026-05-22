import { Grid } from "./grid";
import { NumberGrid } from "./number_grid";
import { VectorGrid } from "./vector_grid";

export type InternalGridType = NumberGrid | VectorGrid;
export type LerpGrid<T> = Grid<T> & {
    sample_at: (x: number, y: number) => T;
};
