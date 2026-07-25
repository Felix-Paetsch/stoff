use geometry::{polygon_area, polygon_signed_area};
use wasm_bindgen::prelude::*;

use crate::{WASMWrapper, geometry::types::WASMPolygon};

#[wasm_bindgen]
pub fn wasm_geometry_polygon_area(gon: &WASMPolygon) -> f64 {
    polygon_area(gon.inner())
}

#[wasm_bindgen]
pub fn wasm_geometry_polygon_signed_area(gon: &WASMPolygon) -> f64 {
    polygon_signed_area(gon.inner())
}
