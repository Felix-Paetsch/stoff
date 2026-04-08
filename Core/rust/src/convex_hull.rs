use crate::utils::{coords_to_vecf64, vecf64_to_linestring};
use geo::ConvexHull;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn convex_hull(coords: &[f64]) -> Option<Vec<f64>> {
    // Expects as input (x1,y1,x2,y2 ...)

    if coords.is_empty() {
        return None;
    }
    let line = vecf64_to_linestring(coords)?;
    let res = line.convex_hull();

    // We reverse to go clockwise
    Some(coords_to_vecf64(res.exterior().coords().rev()))
}
