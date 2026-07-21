use wasm_bindgen::prelude::*;

use crate::{
    advanced::merge_shapes::{
        DoubleRunShapeMergingConfig, ShapeEndpoint, ShapeMergingConfig,
        double_run_merge_shapes_advanced, merge_shapes_advanced,
    },
    geometry::Shape,
    wasm::{WASMWrapper, geometry::types::WASMShapeCollection},
};

#[wasm_bindgen]
pub fn wasm_advanced_merge_shapes(
    shapes: &WASMShapeCollection,
    max_merge_distance: Option<f64>,
    min_line_amount: Option<usize>,
    fixed_endpoints: &[usize],
) -> WASMShapeCollection {
    let cfg = ShapeMergingConfig::new(
        max_merge_distance,
        min_line_amount,
        Some(
            fixed_endpoints
                .windows(2)
                .map(|w| ShapeEndpoint(2 * w[0] + w[1]))
                .collect(),
        ),
    );

    let merged: Vec<Shape> = merge_shapes_advanced(shapes.inner(), cfg);
    WASMShapeCollection::promote(merged)
}

#[wasm_bindgen]
pub fn wasm_advanced_double_run_merge_shapes(
    shapes: &WASMShapeCollection,
    max_merge_distance: Option<f64>,
    min_line_amount: Option<usize>,
) -> WASMShapeCollection {
    let cfg = DoubleRunShapeMergingConfig::new(max_merge_distance, min_line_amount);

    let merged: Vec<Shape> = double_run_merge_shapes_advanced(shapes.inner(), cfg);
    WASMShapeCollection::promote(merged)
}
