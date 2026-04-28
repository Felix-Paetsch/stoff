use geo::ConvexHull;
use wasm_bindgen::prelude::*;

use crate::utils::{coords_to_vecf64, vecf64_to_generalized_line, GeneralizedLine};

#[wasm_bindgen]
pub fn convex_hull(coords: &[f64]) -> Vec<f64> {
    let obj = vecf64_to_generalized_line(coords);
    match obj {
        GeneralizedLine::Empty => vec![],
        GeneralizedLine::Point(p) => coords_to_vecf64(vec![&p.0]),
        GeneralizedLine::Polyline(pl) => {
            coords_to_vecf64(pl.convex_hull().exterior().coords().rev())
        }
    }
}
