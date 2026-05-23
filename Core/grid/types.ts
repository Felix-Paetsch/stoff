import { Vector } from "Core/geometry/vector";
import { Grid } from "./grids/grid";
import { InterpolationGrid } from "./grids/interpolation_grid";

export type InternalInterpolationGridType =
    | InterpolationGrid<number>
    | InterpolationGrid<boolean>
    | InterpolationGrid<Vector>;

export type InternalGridType = Grid<number> | Grid<boolean> | Grid<Vector>;
