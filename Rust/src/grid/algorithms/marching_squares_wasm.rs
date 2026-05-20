use wasm_bindgen::prelude::*;

use crate::{
    geometry::{Geometry, ShapeT},
    grid::{
        algorithms::marching_squares::{marching_squares, ContourLinePositions},
        grid_struct::Grid,
        wasm_compatibility,
    },
};

#[wasm_bindgen]
pub fn wasm_grid_marching_squares(grid: &[f64], contour_argument: &[f64]) -> Vec<f64> {
    // contour argument [0]
    //     0 - integers
    //     1 - value (stored in 2)
    //     2 - values (stored in rest)

    let grid = wasm_compatibility::WASMTransmittableGrid::deserialize(grid);
    let f64_grid: Grid<f64> = grid.into();

    let contour_arg = match contour_argument[0] {
        0.0 => ContourLinePositions::Integer,
        1.0 => ContourLinePositions::Value(contour_argument[1]),
        2.0 => ContourLinePositions::Values(contour_argument.iter().skip(1).cloned().collect()),
        _ => unreachable!(),
    };

    let res = marching_squares(&f64_grid, contour_arg);
    let geoms: Vec<Geometry> = res.into_iter().map(|s| s.into_geometry()).collect();

    Geometry::geometry_vec_to_vecf64(&geoms)
}
