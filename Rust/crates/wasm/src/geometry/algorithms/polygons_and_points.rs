use geometry::{
    RelativePointPosition, Vector, polygon_centroid, polygon_interior_point,
    polygon_relative_point_position,
};
use wasm_bindgen::prelude::wasm_bindgen;

use crate::{
    WASMWrapper,
    geometry::{WASMPolygon, WASMVector},
};

#[wasm_bindgen]
pub fn wasm_geometry_interior_point(gon: &WASMPolygon) -> Option<WASMVector> {
    polygon_interior_point(gon.inner()).map(WASMVector::promote)
}

#[wasm_bindgen]
pub fn wasm_geometry_centroid(gon: &WASMPolygon) -> Option<WASMVector> {
    polygon_centroid(gon.inner()).map(WASMVector::promote)
}

#[wasm_bindgen]
pub fn wasm_geometry_coordiante_position(gon: &WASMPolygon, x: f64, y: f64) -> Option<i8> {
    match polygon_relative_point_position(gon.inner(), Vector::new(x, y)) {
        RelativePointPosition::Outside => Some(-1),
        RelativePointPosition::OnBoundry => Some(0),
        RelativePointPosition::Inside => Some(1),
    }
}
