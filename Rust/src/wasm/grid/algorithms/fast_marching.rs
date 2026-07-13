use std::panic;

use wasm_bindgen::prelude::*;

use crate::{
    geometry::Matrix,
    grid::algorithms::fast_marching::{solve_fast_marching, solve_tensor_fast_marching},
    wasm::{
        WASMWrapper,
        grid::types::{
            wasm_float64_grid::WASMFloat64Grid,
            wasm_grid::{WASMGrid, WASMGridEnum},
        },
    },
};

#[wasm_bindgen]
pub fn wasm_grid_fast_marching(times_map_ser: &mut WASMFloat64Grid, speed_map_ser: &WASMGrid) {
    let times = times_map_ser.inner_mut();

    match speed_map_ser.inner() {
        WASMGridEnum::U8(g) => solve_fast_marching(times, &g.map(|_, a| *a as f64)),
        WASMGridEnum::Float64(g) => solve_fast_marching(times, g),
        WASMGridEnum::Matrix(g) => solve_tensor_fast_marching(times, g),
        WASMGridEnum::Vector(g) => {
            solve_tensor_fast_marching(times, &g.map(|_, a| Matrix::from_vector(*a)))
        }
        _ => panic!("Unexpected speed map type"),
    }
}
