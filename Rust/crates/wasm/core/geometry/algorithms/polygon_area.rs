use wasm_bindgen::prelude::*;

use crate::wasm::{WASMWrapper, geometry::types::WASMPolygon};

#[wasm_bindgen]
pub fn wasm_geometry_polygon_area(gon: &WASMPolygon) -> f64 {
    gon.inner().area()
}

#[wasm_bindgen]
pub fn wasm_geometry_polygon_signed_area(gon: &WASMPolygon) -> f64 {
    gon.inner().signed_area()
}
