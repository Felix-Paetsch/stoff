import { Shape } from "@/Core/geometry";
import { wasm_grid_marching_squares, WASMCompatability } from "Rust/exports";
import { NumberGrid } from "../types";

export type MarchingSquaresContourArgument = "integers" | number | number[];
export function marching_squares(
    g: NumberGrid,
    contour_argument: MarchingSquaresContourArgument = "integers",
) {
    const wasm_grid = WASMCompatability.Grid.wasm_number_grid(g);

    let contour_args: Float64Array;
    if (contour_argument == "integers") {
        contour_args = new Float64Array([0.0]);
    } else if (typeof contour_argument == "number") {
        contour_args = new Float64Array([1.0, contour_argument]);
    } else {
        contour_args = new Float64Array([2.0].concat(contour_argument));
    }

    const squares_res = WASMCompatability.Allocations.free_after_use(
        wasm_grid,
        (wasm_grid) =>
            WASMCompatability.Allocations.allocate(
                wasm_grid_marching_squares(wasm_grid, contour_args),
            ),
    );
    const squares_geometries =
        WASMCompatability.Geometry.shape_collection_from_wasm(squares_res);

    return squares_geometries as Shape.Shape[];
}
