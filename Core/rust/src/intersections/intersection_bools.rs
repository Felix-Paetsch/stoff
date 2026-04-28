use geo::{Intersects, LineString, Polygon, Validation};
use wasm_bindgen::prelude::*;

use crate::utils::{vecf64_to_generalized_line, GeneralizedLine};

#[wasm_bindgen]
pub fn intersects(l1: &[f64], l2: &[f64]) -> bool {
    let mut ln1 = vecf64_to_generalized_line(l1);
    let mut ln2 = vecf64_to_generalized_line(l2);

    if ln1 == GeneralizedLine::Empty || ln2 == GeneralizedLine::Empty {
        return false;
    }

    if let GeneralizedLine::Point(p1) = ln1 {
        ln1 = GeneralizedLine::Polyline(LineString::new(vec![p1.0, p1.0]))
    }

    if let GeneralizedLine::Point(p2) = ln2 {
        ln2 = GeneralizedLine::Polyline(LineString::new(vec![p2.0, p2.0]))
    }

    let GeneralizedLine::Polyline(linestring_1) = ln1 else {
        unreachable!();
    };

    let GeneralizedLine::Polyline(linestring_2) = ln2 else {
        unreachable!();
    };

    linestring_1.intersects(&linestring_2)
}

#[wasm_bindgen]
pub fn self_intersects(pts: &[f64], is_polygon: bool) -> bool {
    let ln = vecf64_to_generalized_line(pts);

    if ln == GeneralizedLine::Empty {
        return false;
    }

    let GeneralizedLine::Polyline(linestring) = ln else {
        unreachable!();
    };

    if !is_polygon {
        return !linestring.is_valid();
    }

    !Polygon::new(linestring, vec![]).is_valid()
}
