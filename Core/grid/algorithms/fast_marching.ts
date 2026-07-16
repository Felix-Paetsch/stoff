import { wasm_grid_fast_marching, WASMCompatability } from "Rust/exports";
import { dimensions_agree } from "../grids/index";
import { MatrixGrid, NumberGrid } from "../types";

export function fast_marching(
    times: NumberGrid,
    speeds: NumberGrid,
): NumberGrid {
    if (!dimensions_agree(speeds, times)) {
        speeds = speeds.with_new_dimensions(times.dimensions());
    }

    const wasm_grid_times = WASMCompatability.Grid.wasm_number_grid(times);
    const wasm_grid_speeds = WASMCompatability.Grid.wasm_grid(speeds);

    // Modifies wasm_grid_times
    wasm_grid_fast_marching(wasm_grid_times, wasm_grid_speeds);

    WASMCompatability.Allocations.free(wasm_grid_speeds);

    return WASMCompatability.Grid.number_grid_from_wasm(wasm_grid_times);
}

export function fast_marching_tensor(
    times: NumberGrid,
    speeds: MatrixGrid,
): NumberGrid {
    if (!dimensions_agree(speeds, times)) {
        speeds = speeds.with_new_dimensions(times.dimensions());
    }

    const wasm_grid_times = WASMCompatability.Grid.wasm_number_grid(times);
    const wasm_grid_speeds = WASMCompatability.Grid.wasm_grid(speeds);

    // Modifies wasm_grid_times
    wasm_grid_fast_marching(wasm_grid_times, wasm_grid_speeds);

    WASMCompatability.Allocations.free(wasm_grid_speeds);

    return WASMCompatability.Grid.number_grid_from_wasm(wasm_grid_times);
}
