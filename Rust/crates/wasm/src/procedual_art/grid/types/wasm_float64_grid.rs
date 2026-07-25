use procedual_art::grid::Grid;
use wasm_bindgen::prelude::*;
use wasm_wrapper_derive::WASMWrapper;

use crate::WASMWrapper;

#[wasm_bindgen]
#[derive(WASMWrapper)]
pub struct WASMFloat64Grid(Grid<f64>);

#[wasm_bindgen]
impl WASMFloat64Grid {
    pub fn domain_dimensions(&self) -> Vec<f64> {
        self.0.domain_dimensions().into()
    }

    pub fn lattice_dimensions(&self) -> Vec<usize> {
        self.0.lattice_dimensions().into()
    }

    pub fn new(
        values: Vec<f64>,
        domain_dims: Vec<f64>,
        lattice_dims: Vec<usize>,
    ) -> WASMFloat64Grid {
        debug_assert_eq!(domain_dims.len(), 4);
        debug_assert_eq!(lattice_dims.len(), 2);

        WASMFloat64Grid::promote(Grid::new(
            domain_dims.try_into().unwrap(),
            lattice_dims.try_into().unwrap(),
            values,
        ))
    }

    pub fn into_values(self) -> Vec<f64> {
        self.into_inner().into_values()
    }
}
