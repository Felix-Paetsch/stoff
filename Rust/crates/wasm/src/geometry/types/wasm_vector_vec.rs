use wasm_bindgen::prelude::*;
use wasm_wrapper_derive::WASMWrapper;

use geometry::Vector;

#[wasm_bindgen]
#[derive(WASMWrapper)]
pub struct WASMVectorVec(Vec<Vector>);

#[wasm_bindgen]
impl WASMVectorVec {
    pub fn new(verts_xy: Vec<f64>) -> WASMVectorVec {
        let verts = verts_xy
            .as_chunks::<2>()
            .0
            .iter()
            .map(|c| Vector::new(c[0], c[1]))
            .collect();
        WASMVectorVec(verts)
    }

    pub fn into_float64_vec(self) -> Vec<f64> {
        self.0.iter().flat_map(|v| [v.x(), v.y()]).collect()
    }
}
