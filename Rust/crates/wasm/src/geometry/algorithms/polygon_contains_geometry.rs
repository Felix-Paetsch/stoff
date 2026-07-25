use geometry::{polygon_contains_geometry, polygon_contains_geometry_properly};
use wasm_bindgen::prelude::wasm_bindgen;

use crate::{
    WASMWrapper,
    geometry::{WASMGeometry, WASMPolygon},
};

#[wasm_bindgen]
pub fn wasm_geometry_polygon_contains_geometry(
    polygon: &WASMPolygon,
    geometry: &WASMGeometry,
) -> bool {
    polygon_contains_geometry(polygon.inner(), geometry.inner())
}

#[wasm_bindgen]
pub fn wasm_geometry_polygon_contains_geometry_properly(
    polygon: &WASMPolygon,
    geometry: &WASMGeometry,
) -> bool {
    polygon_contains_geometry_properly(polygon.inner(), geometry.inner())
}
