use procedual_art::grid::Grid;
use wasm_bindgen::prelude::*;
use wasm_wrapper_derive::WASMWrapper;

use crate::WASMWrapper;

#[wasm_bindgen]
#[derive(WASMWrapper)]
pub struct WASMBooleanGrid(Grid<bool>);

#[wasm_bindgen]
impl WASMBooleanGrid {
    pub fn domain_dimensions(&self) -> Vec<f64> {
        self.0.domain_dimensions().into()
    }

    pub fn lattice_dimensions(&self) -> Vec<usize> {
        self.0.lattice_dimensions().into()
    }

    pub fn new(values: &[u8], domain_dims: Vec<f64>, lattice_dims: Vec<usize>) -> WASMBooleanGrid {
        debug_assert_eq!(domain_dims.len(), 4);
        debug_assert_eq!(lattice_dims.len(), 2);

        WASMBooleanGrid::promote(Grid::new(
            domain_dims.try_into().unwrap(),
            lattice_dims.try_into().unwrap(),
            values.iter().map(|v| *v != 0).collect(),
        ))
    }

    pub fn into_values(self) -> Vec<u8> {
        self.into_inner()
            .into_values()
            .into_iter()
            .map(|b| if b { 1 } else { 0 })
            .collect()
    }
}
