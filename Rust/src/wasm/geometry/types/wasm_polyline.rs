use wasm_bindgen::prelude::*;
use wasm_wrapper_derive::WASMWrapper;

use crate::{
    geometry::{Polyline, ShapeT},
    wasm::{WASMWrapper, geometry::types::WASMVectorVec},
};

#[wasm_bindgen]
#[derive(WASMWrapper)]
pub struct WASMPolyline(Polyline);

#[wasm_bindgen]
impl WASMPolyline {
    pub fn new(verts: WASMVectorVec) -> WASMPolyline {
        WASMPolyline(Polyline::new(verts.into_inner()))
    }

    pub fn into_vertices(self) -> WASMVectorVec {
        WASMVectorVec::promote(self.0.into_vertices())
    }
}
