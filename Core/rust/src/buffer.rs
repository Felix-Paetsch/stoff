use crate::utils::{coords_vec_to_vecf64, linestring_as_geometry, vecf64_to_linestring_vec};
use geo::{Buffer, GeometryCollection};
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn buffer(shapes: &[f64], distance: f64) -> Vec<f64> {
    let ls = vecf64_to_linestring_vec(shapes).unwrap();
    let geoms = ls.into_iter().map(linestring_as_geometry).collect();
    let collection = GeometryCollection(geoms);

    let buffered = collection.buffer(distance);
    coords_vec_to_vecf64(
        buffered
            .0
            .iter()
            .map(|poly| poly.exterior().coords().collect::<Vec<_>>()),
    )
}
