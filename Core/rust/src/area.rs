use crate::utils::vecf64_to_linestring;
use geo::{Area, Polygon};
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn area(coords: &[f64]) -> f64 {
    let ls = vecf64_to_linestring(coords).unwrap();
    let polygon = Polygon::new(ls, vec![]);
    polygon.unsigned_area()
}
