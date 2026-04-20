use crate::utils::{coords_to_vecf64, vecf64_to_linestring};
use geo::concave_hull::ConcaveHullOptions;
use geo::ConcaveHull;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn concave_hull(coords: &[f64], concavity: f64, length_threshold: f64) -> Option<Vec<f64>> {
    if coords.is_empty() {
        return None;
    }

    let line = vecf64_to_linestring(coords)?;
    let res = line.concave_hull_with_options(ConcaveHullOptions {
        concavity,
        length_threshold,
    });

    Some(coords_to_vecf64(res.exterior().coords().rev()))
}
