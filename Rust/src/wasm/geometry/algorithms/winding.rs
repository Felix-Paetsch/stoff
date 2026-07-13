use crate::{
    geometry::algorithms::winding::{WindingOrder, winding_order},
    wasm::{WASMWrapper, geometry::types::WASMPolygon},
};
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn wasm_geometry_winding_order(gon: &WASMPolygon) -> i8 {
    match winding_order(gon.inner()) {
        Some(WindingOrder::Clockwise) => 1,
        Some(WindingOrder::CounterClockwise) => -1,
        None => 0,
    }
}
