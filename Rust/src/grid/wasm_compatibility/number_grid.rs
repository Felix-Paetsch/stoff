use wasm_bindgen::prelude::*;

use crate::grid::grid_struct::Grid;

#[wasm_bindgen]
pub struct WASMTransmittableNumberGrid {
    domain_dimensions: Vec<f64>,
    lattice_dimensions: Vec<u32>,
    values: Vec<f64>,
}

#[wasm_bindgen]
impl WASMTransmittableNumberGrid {
    pub fn new(
        domain_dimensions: Vec<f64>,
        lattice_dimensions: Vec<u32>,
        values: Vec<f64>,
    ) -> WASMTransmittableNumberGrid {
        debug_assert!(values.len() as u32 == lattice_dimensions[0] * lattice_dimensions[1]);
        WASMTransmittableNumberGrid {
            domain_dimensions,
            lattice_dimensions,
            values,
        }
    }

    pub fn domain_dimensions(&self) -> Vec<f64> {
        self.domain_dimensions.to_vec()
    }

    pub fn lattice_dimensions(&self) -> Vec<u32> {
        self.lattice_dimensions.to_vec()
    }

    pub fn into_values(self) -> Vec<f64> {
        self.values
    }
}

impl From<Grid<f64>> for WASMTransmittableNumberGrid {
    fn from(g: Grid<f64>) -> WASMTransmittableNumberGrid {
        let (domain_dimensions, lattice_dimensions, values) = g.into_parts();
        WASMTransmittableNumberGrid {
            domain_dimensions: domain_dimensions.into(),
            lattice_dimensions: vec![lattice_dimensions[0] as u32, lattice_dimensions[1] as u32],
            values,
        }
    }
}

impl From<WASMTransmittableNumberGrid> for Grid<f64> {
    fn from(g: WASMTransmittableNumberGrid) -> Grid<f64> {
        Grid::new(
            g.domain_dimensions
                .try_into()
                .expect("Domain dimensions should have 4 entries!"),
            [
                g.lattice_dimensions[0] as usize,
                g.lattice_dimensions[1] as usize,
            ],
            g.values,
        )
    }
}
