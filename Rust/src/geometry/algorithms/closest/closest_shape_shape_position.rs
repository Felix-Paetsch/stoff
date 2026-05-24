use crate::geometry::{
    algorithms::closest::{
        closest_linesegment_shape_position::closest_linesegment_shape_position_with_length_map,
        closest_point_shape_position::{
            closest_point_shape_position, closest_point_shape_position_with_length_map,
        },
    },
    length_map::LengthMap,
    LineSegment, ShapePosition, ShapeT, Vector,
};

pub struct ClosestShapeShapePositionResult {
    pub positions: [ShapePosition; 2],
    pub distance: f64,
}

pub fn closest_shape_shape_positions(
    shape1: &impl ShapeT,
    shape2: &impl ShapeT,
) -> Option<ClosestShapeShapePositionResult> {
    if shape1.is_empty() || shape2.is_empty() {
        return None;
    }

    if shape1.vertex_count() > shape2.vertex_count() {
        run_closest_shape_position_recursion(shape1, shape2)
    } else {
        run_closest_shape_position_recursion(shape2, shape1)
    }
}

fn run_closest_shape_position_recursion(
    first: &impl ShapeT,
    second: &impl ShapeT,
) -> Option<ClosestShapeShapePositionResult> {
    let vertices = first.vertices();
    closest_shape_positions_recursion(
        vertices,
        LengthMap::new(first.lines()).lengths(),
        RecursiveLineBoundary {
            vertex_index: 0,
            guaranteed_distance: closest_point_shape_position(vertices[0], second)
                .unwrap()
                .distance,
        },
        RecursiveLineBoundary {
            vertex_index: vertices.len() - 1,
            guaranteed_distance: closest_point_shape_position(*vertices.last().unwrap(), second)
                .unwrap()
                .distance,
        },
        f64::INFINITY,
        second,
        &LengthMap::new(second.lines()),
    )
}

#[derive(Clone, Copy)]
struct RecursiveLineBoundary {
    vertex_index: usize,
    guaranteed_distance: f64,
}

// We may assume both shapes have at least 2 vertices
// When this function is called we have already checked that the length from left to right is >=
// best_distance_so_far
fn closest_shape_positions_recursion(
    vertices: &[Vector],
    lengths: &[f64],
    left: RecursiveLineBoundary,
    right: RecursiveLineBoundary,
    best_dist_so_far: f64,
    other_shape: &impl ShapeT,
    other_shape_lengths: &LengthMap,
) -> Option<ClosestShapeShapePositionResult> {
    if best_dist_so_far == 0.0 {
        return None;
    }

    if left.vertex_index + 1 == right.vertex_index {
        let closest = closest_linesegment_shape_position_with_length_map(
            &(LineSegment {
                start: vertices[left.vertex_index],
                end: vertices[right.vertex_index],
            }),
            other_shape,
            other_shape_lengths,
        )
        .unwrap();

        return if closest.distance < best_dist_so_far {
            Some(ClosestShapeShapePositionResult {
                distance: closest.distance,
                positions: [
                    ShapePosition::new(
                        left.vertex_index,
                        closest.linesegment_fraction,
                        closest.shape_position.vec(),
                    ),
                    closest.shape_position,
                ],
            })
        } else {
            None
        };
    }

    let middle_index = (right.vertex_index + left.vertex_index) / 2;
    let len_left_middle = lengths[middle_index] - lengths[left.vertex_index];
    let len_middle_right = lengths[right.vertex_index] - lengths[middle_index];

    if right.guaranteed_distance - len_middle_right >= best_dist_so_far
        || left.guaranteed_distance - len_left_middle >= best_dist_so_far
    {
        return None;
    }

    let middle_distance = closest_point_shape_position_with_length_map(
        vertices[middle_index],
        other_shape,
        other_shape_lengths,
    )
    .unwrap()
    .distance;

    if middle_distance - len_middle_right >= best_dist_so_far
        || middle_distance - len_left_middle >= best_dist_so_far
    {
        return None;
    }

    let middle = RecursiveLineBoundary {
        vertex_index: middle_index,
        guaranteed_distance: middle_distance,
    };

    let pos_option_left = closest_shape_positions_recursion(
        vertices,
        lengths,
        left,
        middle,
        best_dist_so_far,
        other_shape,
        other_shape_lengths,
    );

    let Some(pos1) = &pos_option_left else {
        return closest_shape_positions_recursion(
            vertices,
            lengths,
            middle,
            right,
            best_dist_so_far,
            other_shape,
            other_shape_lengths,
        );
    };

    closest_shape_positions_recursion(
        vertices,
        lengths,
        middle,
        right,
        pos1.distance,
        other_shape,
        other_shape_lengths,
    )
    .or(pos_option_left)
}
