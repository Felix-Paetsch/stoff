use crate::utils::{vecf64_to_generalized_line, GeneralizedLine};
use geo::winding_order::WindingOrder;
use geo::Winding;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn winding(coords: &[f64]) -> i8 {
    let gl = vecf64_to_generalized_line(coords);

    match gl {
        GeneralizedLine::Polyline(ls) => match ls.winding_order() {
            Some(WindingOrder::Clockwise) => 1,
            Some(WindingOrder::CounterClockwise) => -1,
            None => 0,
        },
        _ => 0,
    }
}
