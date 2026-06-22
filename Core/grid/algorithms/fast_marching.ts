import { wasm_grid_fast_marching, WASMCompatability } from "Rust/exports";
import { dimensions_agree } from "../grids/index";
import { NumberGrid } from "../types";

export function fast_marching(
    times: NumberGrid,
    speeds: NumberGrid,
): NumberGrid {
    if (!dimensions_agree(speeds, times)) {
        speeds = speeds.with_new_dimensions(times.dimensions());
    }

    const wasm_grid_times = WASMCompatability.Grid.serialize_number_grid(times);
    const wasm_grid_speeds =
        WASMCompatability.Grid.serialize_number_grid(speeds);
    const res = wasm_grid_fast_marching(wasm_grid_times, wasm_grid_speeds);
    return WASMCompatability.Grid.deserialize_number_grid(res);
}

// export function tensor_fast_marching(
//     times: NumberGrid,
//     speeds: VectorGrid,
// ): NumberGrid {
//     throw new Error("todo!! - should be matrix as input.. matrix grid");
//     const wasm_grid_times = WASMCompatability.Grid.grid_to_vecf64(times);
//     const wasm_grid_speeds = WASMCompatability.Grid.grid_to_vecf64(speeds);
//     const res = wasm_grid_tensor_fast_marching(
//         wasm_grid_times,
//         wasm_grid_speeds,
//     );
//     return WASMCompatability.Grid.vecf64_to_grid(res) as NumberGrid;
// }
//
// export function directional_fast_marching(
//     times: NumberGrid,
//     speeds: VectorGrid,
// ): NumberGrid {
//     throw new Error("todo!!");
//     const wasm_grid_times = WASMCompatability.Grid.grid_to_vecf64(times);
//     const wasm_grid_speeds = WASMCompatability.Grid.grid_to_vecf64(speeds);
//     const res = wasm_grid_directional_fast_marching(
//         wasm_grid_times,
//         wasm_grid_speeds,
//     );
//     return WASMCompatability.Grid.vecf64_to_grid(res) as NumberGrid;
// }
