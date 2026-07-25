use procedual_art::pathing::{walk_shape_with_intersections, walk_shape_without_intersections};
use wasm_bindgen::prelude::*;

use crate::{WASMWrapper, geometry::WASMShape};

#[wasm_bindgen]
pub fn wasm_advanced_walk_shape_without_self_intersection(shape: &WASMShape) -> WASMShape {
    WASMShape::promote(walk_shape_without_intersections(shape.inner()))
}

#[wasm_bindgen]
pub fn wasm_advanced_walk_shape_with_self_intersection(shape: &WASMShape) -> WASMShape {
    WASMShape::promote(walk_shape_with_intersections(shape.inner()))
}
