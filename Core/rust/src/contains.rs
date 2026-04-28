use geo::{Contains, ContainsProperly, Polygon};
use wasm_bindgen::prelude::*;

use crate::utils::{vecf64_to_generalized_line, GeneralizedLine};

#[wasm_bindgen]
pub fn contains(polygon: &[f64], test_pts: &[f64]) -> bool {
    let gl = vecf64_to_generalized_line(polygon);
    let GeneralizedLine::Polyline(ls) = gl else {
        return false;
    };

    let polygon = Polygon::new(ls, vec![]);
    let test_obj = vecf64_to_generalized_line(test_pts);

    match test_obj {
        GeneralizedLine::Empty => true,
        GeneralizedLine::Point(p) => polygon.contains(&p),
        GeneralizedLine::Polyline(pl) => polygon.contains(&pl),
    }
}

#[wasm_bindgen]
pub fn contains_properly(polygon: &[f64], test_pts: &[f64]) -> bool {
    let gl = vecf64_to_generalized_line(polygon);
    let GeneralizedLine::Polyline(ls) = gl else {
        return false;
    };

    let polygon = Polygon::new(ls, vec![]);
    let test_obj = vecf64_to_generalized_line(test_pts);

    match test_obj {
        GeneralizedLine::Empty => true,
        GeneralizedLine::Point(p) => polygon.contains_properly(&p),
        GeneralizedLine::Polyline(pl) => polygon.contains_properly(&pl),
    }
}
