use crate::{
    geometry::algorithms::intersections::{
        ShapeIntersection, find_shape_intersections, find_shape_self_intersections,
        geometries_intersect, shape_self_intersects,
    },
    wasm::{
        WASMWrapper,
        geometry::types::{WASMGeometry, WASMShape},
    },
};
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn wasm_geometry_geometries_intersect(geo1: &WASMGeometry, geo2: &WASMGeometry) -> bool {
    geometries_intersect(geo1.inner(), geo2.inner())
}

#[wasm_bindgen]
pub fn wasm_geometry_shape_self_intersects(s: &WASMShape) -> bool {
    shape_self_intersects(s.inner())
}

#[wasm_bindgen]
pub fn wasm_geometry_shape_self_intersections(shape: &WASMShape) -> Vec<f64> {
    let intersections = find_shape_self_intersections(shape.inner());
    flatten_intersections(&intersections)
}

#[wasm_bindgen]
pub fn wasm_geometry_shape_intersections(shape1: &WASMShape, shape2: &WASMShape) -> Vec<f64> {
    let intersections = find_shape_intersections(shape1.inner(), shape2.inner());
    flatten_intersections(&intersections)
}

pub fn flatten_intersections(intersections: &[ShapeIntersection]) -> Vec<f64> {
    let mut out = Vec::with_capacity(intersections.len() * 6);

    for [a, b] in intersections {
        out.push(a.x());
        out.push(a.y());
        out.push(a.index() as f64);
        out.push(a.frac());
        out.push(b.index() as f64);
        out.push(b.frac());
    }

    out
}
