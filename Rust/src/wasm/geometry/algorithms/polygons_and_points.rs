use wasm_bindgen::prelude::wasm_bindgen;

use crate::{
    geometry::{
        Vector,
        algorithms::polygons_and_points::{
            PointPosition, centroid, coordinate_position, interior_point,
        },
    },
    wasm::{
        WASMWrapper,
        geometry::types::{WASMPolygon, WASMVector},
    },
};

#[wasm_bindgen]
pub fn wasm_geometry_interior_point(gon: &WASMPolygon) -> Option<WASMVector> {
    interior_point(gon.inner()).map(WASMVector::promote)
}

#[wasm_bindgen]
pub fn wasm_geometry_centroid(gon: &WASMPolygon) -> Option<WASMVector> {
    centroid(gon.inner()).map(WASMVector::promote)
}

#[wasm_bindgen]
pub fn wasm_geometry_coordiante_position(gon: &WASMPolygon, x: f64, y: f64) -> Option<i8> {
    match coordinate_position(gon.inner(), Vector::new(x, y)) {
        PointPosition::Outside => Some(-1),
        PointPosition::OnBoundry => Some(0),
        PointPosition::Inside => Some(1),
    }
}
