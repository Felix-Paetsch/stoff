use crate::utils::vecf64_to_linestring;
use geo::{Intersects, Polygon, Validation};
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn intersects(l1: &[f64], l2: &[f64]) -> bool {
    let ln1 = vecf64_to_linestring(l1).unwrap();
    let ln2 = vecf64_to_linestring(l2).unwrap();

    ln1.intersects(&ln2)
}

#[wasm_bindgen]
pub fn self_intersects(pts: &[f64], is_polygon: bool) -> bool {
    let ln = vecf64_to_linestring(pts).unwrap();
    if !is_polygon {
        return !ln.is_valid();
    }

    !Polygon::new(ln, vec![]).is_valid()
}
