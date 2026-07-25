use geometry::closest::{closest_point_on_shape, closest_shape_positions};
use wasm_bindgen::prelude::*;

use crate::{
    WASMWrapper,
    geometry::{WASMShape, WASMShapePosition, WASMVector},
};

#[wasm_bindgen]
pub fn wasm_geometry_closest_point_position_on_shape(
    point: WASMVector,
    shape: &WASMShape,
) -> Option<WASMShapePosition> {
    let closest = closest_point_on_shape(point.into_inner(), shape.inner())?.position;

    Some(WASMShapePosition::promote(closest))
}

#[wasm_bindgen]
pub fn wasm_geometry_closest_shape_positions(
    shape1: &WASMShape,
    shape2: &WASMShape,
) -> Option<Vec<WASMShapePosition>> {
    let res = closest_shape_positions(shape1.inner(), shape2.inner())?.positions;

    Some(res.into_iter().map(WASMShapePosition::promote).collect())
}
