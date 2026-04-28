use wasm_bindgen::prelude::*;

use crate::global_compatability_layer::vecf64_to_vertex_vec;

#[wasm_bindgen]
pub fn run_intersection_free(polyline_coords: &[f64]) -> Vec<f64> {
    let g = vecf64_to_vertex_vec(polyline_coords);

    todo!();
}
