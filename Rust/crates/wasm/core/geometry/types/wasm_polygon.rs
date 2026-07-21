use wasm_bindgen::prelude::*;
use wasm_wrapper_derive::WASMWrapper;

use crate::{
    geometry::{Polygon, ShapeT},
    wasm::{WASMWrapper, geometry::types::WASMVectorVec},
};

#[wasm_bindgen]
#[derive(WASMWrapper)]
pub struct WASMPolygon(Polygon);

#[wasm_bindgen]
impl WASMPolygon {
    pub fn new(verts: WASMVectorVec) -> WASMPolygon {
        WASMPolygon(Polygon::new(verts.into_inner()))
    }

    pub fn into_vertices(self) -> WASMVectorVec {
        WASMVectorVec::promote(self.0.into_vertices())
    }
}
