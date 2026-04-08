use crate::utils::vecf64_to_linestring;
use geo::Winding;
use geo::winding_order::WindingOrder;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn winding(coords: &[f64]) -> i8 {
    let ls = vecf64_to_linestring(coords).unwrap();

    match ls.winding_order() {
        Some(WindingOrder::Clockwise) => 1,
        Some(WindingOrder::CounterClockwise) => -1,
        None => 0,
    }
}
