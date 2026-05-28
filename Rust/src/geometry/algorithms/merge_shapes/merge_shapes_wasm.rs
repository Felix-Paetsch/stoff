use wasm_bindgen::prelude::*;

use crate::geometry::{algorithms::merge_shapes::index::merge_shapes, Geometry, Shape, ShapeT};

#[wasm_bindgen]
pub fn wasm_geometry_merge_shapes(shapes: &[f64]) -> Vec<f64> {
    let shapes: Vec<Shape> = Geometry::vecf64_to_geometry_vec(shapes)
        .into_iter()
        .map(|s| Shape::from_geometry(s).unwrap())
        .collect();

    let merged = merge_shapes(shapes);
    merged.into_geometry().serialize()
}
