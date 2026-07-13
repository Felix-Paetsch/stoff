use wasm_bindgen::prelude::*;
use wasm_wrapper_derive::WASMWrapper;

use crate::{
    geometry::Geometry,
    wasm::{WASMWrapper, geometry::types::WASMGeometry},
};

#[wasm_bindgen]
#[derive(WASMWrapper)]
pub struct WASMGeometryCollection(Vec<Geometry>);

#[wasm_bindgen]
impl WASMGeometryCollection {
    pub fn push(&mut self, g: WASMGeometry) {
        self.0.push(g.into_inner());
    }

    pub fn pop(&mut self) -> Option<WASMGeometry> {
        self.0.pop().map(WASMGeometry::promote)
    }

    pub fn len(&self) -> usize {
        self.0.len()
    }

    pub fn new() -> WASMGeometryCollection {
        WASMGeometryCollection(vec![])
    }

    pub fn with_capacity(c: usize) -> WASMGeometryCollection {
        WASMGeometryCollection(Vec::with_capacity(c))
    }
}
