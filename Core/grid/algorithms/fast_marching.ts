import {
    wasm_grid_directional_fast_marching,
    wasm_grid_fast_marching,
    wasm_grid_tensor_fast_marching,
    WASMCompatability,
} from "Rust/exports";
import { NumberGrid } from "../grids/number_grid";
import { VectorGrid } from "../grids/vector_grid";

export function fast_marching(
    times: NumberGrid,
    speeds: NumberGrid,
): NumberGrid {
    if (!times.same_dimensions(speeds)) {
        speeds = speeds.resample(times.dimensions());
    }

    const wasm_grid_times = WASMCompatability.Grid.grid_to_vecf64(times);
    const wasm_grid_speeds = WASMCompatability.Grid.grid_to_vecf64(speeds);
    const res = wasm_grid_fast_marching(wasm_grid_times, wasm_grid_speeds);
    return WASMCompatability.Grid.vecf64_to_grid(res) as NumberGrid;
}

export function tensor_fast_marching(
    times: NumberGrid,
    speeds: VectorGrid,
): NumberGrid {
    const wasm_grid_times = WASMCompatability.Grid.grid_to_vecf64(times);
    const wasm_grid_speeds = WASMCompatability.Grid.grid_to_vecf64(speeds);
    const res = wasm_grid_tensor_fast_marching(
        wasm_grid_times,
        wasm_grid_speeds,
    );
    return WASMCompatability.Grid.vecf64_to_grid(res) as NumberGrid;
}

export function directional_fast_marching(
    times: NumberGrid,
    speeds: VectorGrid,
): NumberGrid {
    const wasm_grid_times = WASMCompatability.Grid.grid_to_vecf64(times);
    const wasm_grid_speeds = WASMCompatability.Grid.grid_to_vecf64(speeds);
    const res = wasm_grid_directional_fast_marching(
        wasm_grid_times,
        wasm_grid_speeds,
    );
    return WASMCompatability.Grid.vecf64_to_grid(res) as NumberGrid;
}
