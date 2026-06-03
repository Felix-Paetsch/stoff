use wasm_bindgen::prelude::*;

use crate::{
    geometry::Vector,
    grid::{
        algorithms::fast_marching::index::{
            solve_directional_fast_marching, solve_fast_marching, solve_tensor_fast_marching,
        },
        grid_struct::Grid,
        wasm_compatibility,
    },
};

#[wasm_bindgen]
pub fn wasm_grid_fast_marching(times_map_ser: &[f64], speed_map_ser: &[f64]) -> Vec<f64> {
    let times_map = wasm_compatibility::WASMTransmittableGrid::deserialize(times_map_ser);
    let mut times_map: Grid<f64> = times_map.into();

    let speed_map = wasm_compatibility::WASMTransmittableGrid::deserialize(speed_map_ser);
    let speed_map: Grid<f64> = speed_map.into();

    solve_fast_marching(&mut times_map, &speed_map);
    wasm_compatibility::WASMTransmittableGrid::from(times_map).serialize()
}

#[wasm_bindgen]
pub fn wasm_grid_tensor_fast_marching(times_map_ser: &[f64], speed_map_ser: &[f64]) -> Vec<f64> {
    let times_map = wasm_compatibility::WASMTransmittableGrid::deserialize(times_map_ser);
    let mut times_map: Grid<f64> = times_map.into();

    let speed_map = wasm_compatibility::WASMTransmittableGrid::deserialize(speed_map_ser);
    let speed_map: Grid<Vector> = speed_map.into();

    solve_tensor_fast_marching(&mut times_map, &speed_map);
    wasm_compatibility::WASMTransmittableGrid::from(times_map).serialize()
}

#[wasm_bindgen]
pub fn wasm_grid_directional_fast_marching(
    times_map_ser: &[f64],
    speed_map_ser: &[f64],
) -> Vec<f64> {
    let times_map = wasm_compatibility::WASMTransmittableGrid::deserialize(times_map_ser);
    let mut times_map: Grid<f64> = times_map.into();

    let speed_map = wasm_compatibility::WASMTransmittableGrid::deserialize(speed_map_ser);
    let speed_map: Grid<Vector> = speed_map.into();

    solve_directional_fast_marching(&mut times_map, &speed_map);
    wasm_compatibility::WASMTransmittableGrid::from(times_map).serialize()
}
