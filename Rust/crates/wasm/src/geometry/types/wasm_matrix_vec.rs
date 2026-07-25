use wasm_bindgen::prelude::*;
use wasm_wrapper_derive::WASMWrapper;

use geometry::Matrix;

#[wasm_bindgen]
#[derive(WASMWrapper)]
pub struct WASMMatrixVec(Vec<Matrix>);

#[wasm_bindgen]
impl WASMMatrixVec {
    pub fn new(matrix_abcd_s: Vec<f64>) -> WASMMatrixVec {
        let verts = matrix_abcd_s
            .as_chunks::<4>()
            .0
            .iter()
            .map(|c| Matrix::new(c[0], c[1], c[2], c[3]))
            .collect();

        WASMMatrixVec(verts)
    }

    pub fn into_float64_vec(self) -> Vec<f64> {
        self.0
            .iter()
            .flat_map(|v| [v.a(), v.b(), v.c(), v.d()])
            .collect()
    }
}
