use wasm_bindgen::prelude::*;
use wasm_wrapper_derive::WASMWrapper;

use crate::{
    geometry::{ShapePosition, Vector},
    wasm::{WASMWrapper, geometry::types::WASMVector},
};

#[wasm_bindgen]
#[derive(WASMWrapper)]
pub struct WASMShapePosition(ShapePosition);

#[wasm_bindgen]
impl WASMShapePosition {
    pub fn new(start_index: usize, fraction: f64, vec_x: f64, vec_y: f64) -> WASMShapePosition {
        WASMShapePosition(ShapePosition::new(
            start_index,
            fraction,
            Vector::new(vec_x, vec_y),
        ))
    }

    pub fn vec(&self) -> WASMVector {
        WASMVector::promote(self.0.vec())
    }

    pub fn index(&self) -> usize {
        self.0.index()
    }

    pub fn fraction(&self) -> f64 {
        self.0.frac()
    }
}
