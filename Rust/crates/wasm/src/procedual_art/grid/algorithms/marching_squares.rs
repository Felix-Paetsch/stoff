use procedual_art::grid::{
    Grid,
    marching_squares::{ContourLinePositions, marching_squares},
};
use wasm_bindgen::prelude::*;

use crate::{WASMWrapper, geometry::WASMShapeCollection, procedual_art::grid::WASMFloat64Grid};

#[wasm_bindgen]
pub fn wasm_grid_marching_squares(
    grid: &WASMFloat64Grid,
    contour_argument: &[f64],
) -> WASMShapeCollection {
    let f64_grid: &Grid<f64> = grid.inner();

    let contour_arg = match contour_argument[0] {
        0.0 => ContourLinePositions::Integer,
        1.0 => ContourLinePositions::Value(contour_argument[1]),
        2.0 => ContourLinePositions::Values(contour_argument.iter().skip(1).cloned().collect()),
        _ => unreachable!(),
    };

    let res = marching_squares(f64_grid, contour_arg);
    WASMShapeCollection::promote(res)
}
