use crate::utils::{vecf64_to_generalized_line, GeneralizedLine};
use geo::{Area, Polygon};
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn area(coords: &[f64]) -> f64 {
    let ls = vecf64_to_generalized_line(coords);

    match ls {
        GeneralizedLine::Empty => 0.0,
        GeneralizedLine::Point(_) => 0.0,
        GeneralizedLine::Polyline(ls) => {
            let polygon = Polygon::new(ls, vec![]);
            polygon.unsigned_area()
        }
    }
}
