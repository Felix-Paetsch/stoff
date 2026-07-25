use geometry::convex_hull;
use wasm_bindgen::prelude::*;

use crate::{
    WASMWrapper,
    geometry::{WASMPolygon, WASMVectorVec},
};

#[wasm_bindgen]
pub fn wasm_geometry_convex_hull(of: &WASMVectorVec) -> WASMPolygon {
    convex_hull(of.inner()).into()
}
