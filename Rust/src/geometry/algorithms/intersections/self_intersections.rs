use crate::geometry::{
    ShapeT,
    algorithms::{
        intersections::{
            shape_intersections::find_shape_intersections_recursion,
            utils::{Intersection, deduped_self_intersections},
        },
        length_recursion::{
            index::{half_shape, initial_recursion_data},
            types::LengthRecursionData,
        },
    },
    length_map::LengthMap,
};

pub fn find_shape_self_intersections(shape: &impl ShapeT) -> Vec<Intersection> {
    let length_map = LengthMap::new(shape.lines());

    let mut result: Vec<Intersection> = vec![];

    find_self_intersections_recursion(
        shape,
        initial_recursion_data(shape, length_map.lengths(), |_| 0.0),
        &mut result,
    );

    debug_assert!(result.iter().all(|int| int[0] <= int[1]));
    deduped_self_intersections(result, length_map.lengths(), shape)
}

// Approach: Find intersections of left and right halfs as well as internal intersections
// When checking left and right we can skip and additional index
pub fn find_self_intersections_recursion(
    shape: &impl ShapeT,
    data: LengthRecursionData,
    result: &mut Vec<Intersection>,
) {
    debug_assert_eq!(shape.linesegment_count() + 1, data.lengths.len());

    if data.right.vertex_index - data.left.vertex_index <= 1 {
        return;
    }

    let halfed = half_shape(shape, &data, |_| 0.0);
    let [left_half, right_half] = halfed;

    find_self_intersections_recursion(shape, left_half, result);
    find_self_intersections_recursion(shape, right_half, result);

    // Note that we autiomatically include the point just between the two halves.
    // Probably not perf. critical
    find_shape_intersections_recursion(shape, left_half, shape, right_half, result);
}
