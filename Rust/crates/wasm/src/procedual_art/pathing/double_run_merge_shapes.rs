use procedual_art::pathing::{DoubleRunShapeMergingOptions, double_run_merge_shapes_with_options};
use wasm_bindgen::prelude::*;

use crate::{WASMWrapper, geometry::WASMShapeCollection};

#[wasm_bindgen]
pub fn wasm_pathing_double_run_merge_shapes(
    shapes: &WASMShapeCollection,
    max_merge_distance: f64,
    min_line_amount: usize,
) -> WASMShapeCollection {
    let res = double_run_merge_shapes_with_options(
        shapes.inner(),
        DoubleRunShapeMergingOptions::new(Some(max_merge_distance), Some(min_line_amount)),
    );

    WASMShapeCollection::promote(res)
}
