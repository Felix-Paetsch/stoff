use geometry::Matrix;
use procedual_art::grid::Grid;
use wasm_bindgen::prelude::*;
use wasm_wrapper_derive::WASMWrapper;

use crate::{WASMWrapper, geometry::WASMMatrixVec};

#[wasm_bindgen]
#[derive(WASMWrapper)]
pub struct WASMMatrixGrid(Grid<Matrix>);

#[wasm_bindgen]
impl WASMMatrixGrid {
    pub fn domain_dimensions(&self) -> Vec<f64> {
        self.0.domain_dimensions().into()
    }

    pub fn lattice_dimensions(&self) -> Vec<usize> {
        self.0.lattice_dimensions().into()
    }

    pub fn new(
        values: WASMMatrixVec,
        domain_dims: Vec<f64>,
        lattice_dims: Vec<usize>,
    ) -> WASMMatrixGrid {
        debug_assert_eq!(domain_dims.len(), 4);
        debug_assert_eq!(lattice_dims.len(), 2);

        WASMMatrixGrid::promote(Grid::new(
            domain_dims.try_into().unwrap(),
            lattice_dims.try_into().unwrap(),
            values.into_inner(),
        ))
    }

    pub fn into_values(self) -> WASMMatrixVec {
        WASMMatrixVec::promote(self.into_inner().into_values())
    }
}
