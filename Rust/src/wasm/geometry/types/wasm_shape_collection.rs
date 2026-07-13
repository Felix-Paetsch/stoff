use wasm_bindgen::prelude::*;
use wasm_wrapper_derive::WASMWrapper;

use crate::{
    geometry::{Shape, ShapeT},
    wasm::{
        WASMWrapper,
        geometry::types::{WASMGeometryCollection, WASMShape},
    },
};

#[wasm_bindgen]
#[derive(WASMWrapper)]
pub struct WASMShapeCollection(Vec<Shape>);

#[wasm_bindgen]
impl WASMShapeCollection {
    pub fn push(&mut self, g: WASMShape) {
        self.0.push(g.into_inner());
    }

    pub fn pop(&mut self) -> Option<WASMShape> {
        self.0.pop().map(WASMShape::promote)
    }

    pub fn len(&self) -> usize {
        self.0.len()
    }

    pub fn new() -> WASMShapeCollection {
        WASMShapeCollection(vec![])
    }

    pub fn with_capacity(c: usize) -> WASMShapeCollection {
        WASMShapeCollection(Vec::with_capacity(c))
    }

    pub fn into_geometry_collection(self) -> WASMGeometryCollection {
        WASMGeometryCollection::promote(self.0.into_iter().map(|s| s.into_geometry()).collect())
    }
}
