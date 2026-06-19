use wasm_bindgen::prelude::*;

use crate::geometry::{
    Geometry, Shape, ShapeT,
    algorithms::merge_shapes::{
        DoubleRunShapeMergingConfig, ShapeEndpoint, ShapeMergingConfig,
        double_run_merge_shapes_advanced, merge_shapes_advanced,
    },
};

#[wasm_bindgen]
pub fn wasm_geometry_merge_shapes_advanced(
    shapes: &[f64],
    max_merge_distance: Option<f64>,
    min_line_amount: Option<usize>,
    fixed_endpoints: &[usize],
) -> Vec<f64> {
    let shapes: Vec<Shape> = Geometry::vecf64_to_geometry_vec(shapes)
        .into_iter()
        .map(|s| Shape::from_geometry(s).unwrap())
        .collect();

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

    let merged: Vec<Shape> = merge_shapes_advanced(&shapes, cfg);
    Geometry::geometry_vec_to_vecf64(merged.into_iter().map(|s| s.into_geometry()))
}

#[wasm_bindgen]
pub fn wasm_geometry_double_run_merge_shapes_advanced(
    shapes: &[f64],
    max_merge_distance: Option<f64>,
    min_line_amount: Option<usize>,
) -> Vec<f64> {
    let shapes: Vec<Shape> = Geometry::vecf64_to_geometry_vec(shapes)
        .into_iter()
        .map(|s| Shape::from_geometry(s).unwrap())
        .collect();

    let cfg = DoubleRunShapeMergingConfig::new(max_merge_distance, min_line_amount);

    let merged: Vec<Shape> = double_run_merge_shapes_advanced(&shapes, cfg);
    Geometry::geometry_vec_to_vecf64(merged.into_iter().map(|s| s.into_geometry()))
}
