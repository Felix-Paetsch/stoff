use wasm_bindgen::prelude::wasm_bindgen;

use crate::{
    geometry::algorithms::simplify::{into_simplified_shape_with_eps, simplify_shape_with_eps},
    wasm::{WASMWrapper, geometry::types::WASMShape},
};

#[wasm_bindgen]
pub fn wasm_geometry_into_simplified(gon: WASMShape, eps: f64) -> WASMShape {
    WASMShape::promote(into_simplified_shape_with_eps(gon.into_inner(), eps))
}

#[wasm_bindgen]
pub fn wasm_geometry_simplify(gon: &WASMShape, eps: f64) -> WASMShape {
    WASMShape::promote(simplify_shape_with_eps(gon.inner(), eps))
}
