use geo::concave_hull::ConcaveHullOptions;
use geo::ConcaveHull;
use wasm_bindgen::prelude::*;

use crate::utils::{coords_to_vecf64, vecf64_to_generalized_line, GeneralizedLine};

#[wasm_bindgen]
pub fn concave_hull(coords: &[f64], concavity: f64, length_threshold: f64) -> Option<Vec<f64>> {
    let line = vecf64_to_generalized_line(coords);

    match line {
        GeneralizedLine::Empty => None,
        GeneralizedLine::Point(pt) => Some(vec![pt.x(), pt.y()]),
        GeneralizedLine::Polyline(pl) => {
            let hull = pl.concave_hull_with_options(ConcaveHullOptions {
                concavity,
                length_threshold,
            });

            Some(coords_to_vecf64(hull.exterior().coords().rev()))
        }
    }
}
