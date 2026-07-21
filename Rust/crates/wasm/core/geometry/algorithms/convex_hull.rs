use wasm_bindgen::prelude::*;

use crate::{
    geometry::algorithms::convex_hull::convex_hull,
    wasm::{
        WASMWrapper,
        geometry::types::{WASMPolygon, WASMVectorVec},
    },
};

#[wasm_bindgen]
pub fn wasm_geometry_convex_hull(of: &WASMVectorVec) -> WASMPolygon {
    convex_hull(of.inner()).into()
}
