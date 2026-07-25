use geometry::{WindingOrder, polygon_winding_order};
use wasm_bindgen::prelude::*;

use crate::{WASMWrapper, geometry::WASMPolygon};

#[wasm_bindgen]
pub fn wasm_geometry_winding_order(gon: &WASMPolygon) -> i8 {
    match polygon_winding_order(gon.inner()) {
        Some(WindingOrder::Clockwise) => 1,
        Some(WindingOrder::CounterClockwise) => -1,
        None => 0,
    }
}
