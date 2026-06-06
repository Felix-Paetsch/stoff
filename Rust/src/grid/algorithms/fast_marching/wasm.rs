use wasm_bindgen::prelude::*;

use crate::grid::{
    algorithms::fast_marching::index::solve_fast_marching, grid_struct::Grid,
    wasm_compatibility::number_grid::WASMTransmittableNumberGrid,
};

#[wasm_bindgen]
pub fn wasm_grid_fast_marching(
    times_map_ser: WASMTransmittableNumberGrid,
    speed_map_ser: WASMTransmittableNumberGrid,
) -> WASMTransmittableNumberGrid {
    let mut times_map: Grid<f64> = times_map_ser.into();
    let speed_map: Grid<f64> = speed_map_ser.into();

    solve_fast_marching(&mut times_map, &speed_map);
    times_map.into()
}
