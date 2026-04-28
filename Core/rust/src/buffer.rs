use crate::utils::{coords_vec_to_vecf64, vecf64_to_generalized_line_vec, GeneralizedLine};
use geo::{Buffer, Geometry, GeometryCollection};
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn buffer(shapes: &[f64], distance: f64) -> Vec<f64> {
    let ls = vecf64_to_generalized_line_vec(shapes);

    let geoms: Vec<Geometry> = ls
        .into_iter()
        .filter_map(|shape| match shape {
            GeneralizedLine::Empty => None,
            GeneralizedLine::Point(p) => Some(Geometry::Point(p)),
            GeneralizedLine::Polyline(pl) => Some(Geometry::LineString(pl)),
        })
        .collect();

    let collection = GeometryCollection(geoms);

    let buffered = collection.buffer(distance);
    coords_vec_to_vecf64(
        buffered
            .0
            .iter()
            .map(|poly| poly.exterior().coords().collect::<Vec<_>>()),
    )
}
