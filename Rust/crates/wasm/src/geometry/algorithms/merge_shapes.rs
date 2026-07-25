use geometry::{Shape, ShapeMergingOptions, merge_shapes_with_options};
use procedual_art::pathing::{DoubleRunShapeMergingOptions, double_run_merge_shapes_with_options};
use wasm_bindgen::prelude::*;

use crate::{WASMWrapper, geometry::WASMShapeCollection};

#[wasm_bindgen]
pub fn wasm_geometry_merge_shapes(
    shapes: &WASMShapeCollection,
    max_merge_distance: Option<f64>,
    min_line_amount: Option<usize>,
    fixed_endpoints: &[usize],
) -> WASMShapeCollection {
    let cfg = ShapeMergingOptions::new(
        max_merge_distance,
        min_line_amount,
        Some(
            fixed_endpoints
                .windows(2)
                .map(|w| (w[0], w[1] != 0))
                .collect(),
        ),
    );

    let merged: Vec<Shape> = merge_shapes_with_options(shapes.inner(), cfg);
    WASMShapeCollection::promote(merged)
}

#[wasm_bindgen]
pub fn wasm_geometry_double_run_merge_shapes(
    shapes: &WASMShapeCollection,
    max_merge_distance: Option<f64>,
    min_line_amount: Option<usize>,
) -> WASMShapeCollection {
    let cfg = DoubleRunShapeMergingOptions::new(max_merge_distance, min_line_amount);

    let merged: Vec<Shape> = double_run_merge_shapes_with_options(shapes.inner(), cfg);
    WASMShapeCollection::promote(merged)
}
