use crate::utils::vecf64_to_linestring;
use geo::{Contains, ContainsProperly, Polygon};
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn contains(polygon: &[f64], test_pts: &[f64]) -> bool {
    let ls = vecf64_to_linestring(polygon).unwrap();
    let polygon = Polygon::new(ls, vec![]);

    let test_obj = vecf64_to_linestring(test_pts).unwrap();

    polygon.contains(&test_obj)
}

#[wasm_bindgen]
pub fn contains_properly(polygon: &[f64], test_pts: &[f64]) -> bool {
    let ls = vecf64_to_linestring(polygon).unwrap();
    let polygon = Polygon::new(ls, vec![]);

    let test_obj = vecf64_to_linestring(test_pts).unwrap();

    polygon.contains_properly(&test_obj)
}
