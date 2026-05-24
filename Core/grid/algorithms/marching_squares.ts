import { Grid } from "@/Core";
import { Shape } from "@/Core/geometry";
import { wasm_grid_marching_squares, WASMCompatability } from "Rust/exports";

export type MarchingSquaresContourArgument = "integers" | number | number[];
export function maching_squares(
    g: Grid.Grid<number>,
    contour_argument: MarchingSquaresContourArgument = "integers",
) {
    const wasm_grid = WASMCompatability.Grid.grid_to_vecf64(g);

    let contour_args: Float64Array;
    if (contour_argument == "integers") {
        contour_args = new Float64Array([0.0]);
    } else if (typeof contour_argument == "number") {
        contour_args = new Float64Array([1.0, contour_argument]);
    } else {
        contour_args = new Float64Array([2.0].concat(contour_argument));
    }

    const squares_res = wasm_grid_marching_squares(wasm_grid, contour_args);
    const squares_geometries =
        WASMCompatability.Geometry.vecf64_to_geometry_vec(squares_res);
    return squares_geometries as Shape.Shape[];
}
