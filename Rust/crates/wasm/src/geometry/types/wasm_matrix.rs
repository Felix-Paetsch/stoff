use wasm_bindgen::prelude::*;
use wasm_wrapper_derive::WASMWrapper;

use geometry::Matrix;

#[wasm_bindgen]
#[derive(WASMWrapper, Clone, Copy)]
pub struct WASMMatrix(Matrix);

#[wasm_bindgen]
impl WASMMatrix {
    pub fn new(a: f64, b: f64, c: f64, d: f64) -> WASMMatrix {
        WASMMatrix(Matrix::new(a, b, c, d))
    }

    pub fn a(&self) -> f64 {
        self.0.a()
    }

    pub fn b(&self) -> f64 {
        self.0.b()
    }

    pub fn c(&self) -> f64 {
        self.0.c()
    }

    pub fn d(&self) -> f64 {
        self.0.d()
    }
}
