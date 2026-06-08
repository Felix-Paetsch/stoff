use wasm_bindgen::prelude::*;

use crate::grid::grid_struct::Grid;

#[wasm_bindgen]
pub struct WASMTransmittableU8Grid {
    domain_dimensions: Vec<f64>,
    lattice_dimensions: Vec<u32>,
    values: Vec<u8>,
}

#[wasm_bindgen]
impl WASMTransmittableU8Grid {
    pub fn new(
        domain_dimensions: Vec<f64>,
        lattice_dimensions: Vec<u32>,
        values: Vec<u8>,
    ) -> WASMTransmittableU8Grid {
        WASMTransmittableU8Grid {
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

    pub fn into_values(self) -> Vec<u8> {
        self.values
    }
}

impl From<Grid<u8>> for WASMTransmittableU8Grid {
    fn from(g: Grid<u8>) -> WASMTransmittableU8Grid {
        let (domain_dimensions, lattice_dimensions, values) = g.into_parts();
        WASMTransmittableU8Grid {
            domain_dimensions: domain_dimensions.into(),
            lattice_dimensions: vec![lattice_dimensions[0] as u32, lattice_dimensions[1] as u32],
            values,
        }
    }
}

impl From<WASMTransmittableU8Grid> for Grid<u8> {
    fn from(g: WASMTransmittableU8Grid) -> Grid<u8> {
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
