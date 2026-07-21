use wasm_bindgen::prelude::*;
use wasm_wrapper_derive::WASMWrapper;

use crate::geometry::Vector;

#[wasm_bindgen]
#[derive(WASMWrapper, Clone, Copy)]
pub struct WASMVector(Vector);

#[wasm_bindgen]
impl WASMVector {
    pub fn new(x: f64, y: f64) -> WASMVector {
        WASMVector(Vector::new(x, y))
    }

    pub fn x(&self) -> f64 {
        self.0.x()
    }

    pub fn y(&self) -> f64 {
        self.0.y()
    }
}
