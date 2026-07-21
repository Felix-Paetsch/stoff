use wasm_bindgen::prelude::*;
use wasm_wrapper_derive::WASMWrapper;

use crate::{grid::grid_struct::Grid, wasm::WASMWrapper};

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

    pub fn new(values: &[u8], domain_dims: Vec<f64>, lattice_dims: Vec<usize>) -> WASMVec3u8Grid {
        debug_assert_eq!(domain_dims.len(), 4);
        debug_assert_eq!(lattice_dims.len(), 2);

        WASMVec3u8Grid::promote(Grid::new(
            domain_dims.try_into().unwrap(),
            lattice_dims.try_into().unwrap(),
            values.as_chunks::<3>().0.to_vec(),
        ))
    }

    pub fn into_values_flat(self) -> Vec<u8> {
        self.into_inner()
            .into_values()
            .into_iter()
            .flatten()
            .collect()
    }
}
