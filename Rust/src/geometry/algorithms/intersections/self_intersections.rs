use wasm_bindgen::prelude::*;

use crate::geometry::{
    algorithms::{
        intersections::{
            shape_intersections::find_shape_intersections_recursion,
            utils::{deduped_self_intersections, flatten_intersections, Intersection},
        },
        length_recursion::{
            index::{half_shape, initial_recursion_data},
            types::{LengthRecursionData, RecursiveLineBoundary},
        },
    },
    length_map::LengthMap,
    Geometry, Shape, ShapeT,
};

pub fn find_self_intersections(shape: &impl ShapeT) -> Vec<Intersection> {
    let length_map = LengthMap::new(shape.lines());
    let intersections = find_self_intersections_recursion(
        shape,
        initial_recursion_data(shape, length_map.lengths(), |_| 0.0),
    );

    deduped_self_intersections(intersections, length_map.lengths(), shape)
}

// Approach: Find intersections of left and right halfs as well as internal intersections
// When checking left and right we can skip and additional index
pub fn find_self_intersections_recursion(
    shape: &impl ShapeT,
    data: LengthRecursionData,
) -> Vec<Intersection> {
    debug_assert_eq!(shape.linesegment_count() + 1, data.lengths.len());

    if data.right.vertex_index - data.left.vertex_index <= 1 {
        return vec![];
    }

    let halfed = half_shape(shape, &data, |_| 0.0);
    let [left_half, right_half] = halfed;

    let mut self_intersections_left = find_self_intersections_recursion(shape, left_half);
    let self_intersections_right = find_self_intersections_recursion(shape, right_half);
    let inter_intersections = find_shape_intersections_recursion(
        shape,
        left_half,
        shape,
        LengthRecursionData {
            lengths: data.lengths,
            left: RecursiveLineBoundary {
                vertex_index: right_half.left.vertex_index + 1,
                guaranteed_distance: data.lengths[right_half.left.vertex_index + 1]
                    - data.lengths[right_half.left.vertex_index],
            },
            right: right_half.right,
        },
    );

    self_intersections_left.extend(self_intersections_right);
    self_intersections_left.extend(inter_intersections);
    self_intersections_left
}

#[wasm_bindgen]
pub fn wasm_geometry_shape_self_intersections(geo: &[f64]) -> Vec<f64> {
    let geom = Geometry::deserialize(geo);

    let shape = Shape::from_geometry(geom).unwrap();

    let intersections = find_self_intersections(&shape);
    flatten_intersections(&intersections)
}
