use wasm_bindgen::prelude::*;
use wasm_wrapper_derive::WASMWrapper;

use crate::grid::grid_struct::Grid;

#[wasm_bindgen]
#[derive(WASMWrapper)]
pub struct WASMVec3u8Grid(Grid<[u8; 3]>);

#[wasm_bindgen]
impl WASMVec3u8Grid {
    pub fn domain_dimensions(&self) -> Vec<f64> {
        self.0.domain_dimensions().into()
    }

    pub fn lattice_dimensions(&self) -> Vec<usize> {
        self.0.lattice_dimensions().into()
    }
}
