use crate::geometry::{
    algorithms::closest::{
        self,
        closest_linesegment_shape_position::closest_linesegment_shape_position_with_length_map_recursion,
        closest_point_on_shape_with_length_map,
        closest_point_shape_position::closest_point_on_shape_with_length_map_recursion,
        shared::RecursiveLineBoundary,
    },
    length_map::LengthMap,
    LineSegment, ShapePosition, ShapeT,
};

pub struct ClosestShapePositionsResult {
    pub positions: [ShapePosition; 2],
    pub distance: f64,
}

pub fn closest_shape_positions(
    shape1: &impl ShapeT,
    shape2: &impl ShapeT,
) -> Option<ClosestShapePositionsResult> {
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
) -> Option<ClosestShapePositionsResult> {
    let lengths1_map = LengthMap::new(first.lines());
    let lengths1 = lengths1_map.lengths();
    let lengths2_map = &LengthMap::new(second.lines());
    let lengths2 = lengths2_map.lengths();

    closest_shape_positions_recursion(
        first,
        lengths1,
        second,
        lengths2,
        RecursiveLineBoundary {
            vertex_index: 0,
            guaranteed_distance: closest_point_on_shape_with_length_map(
                first.vertex_at(0),
                second,
                lengths2_map,
            )
            .unwrap()
            .distance,
        },
        RecursiveLineBoundary {
            vertex_index: first.looping_vertex_count() - 1,
            guaranteed_distance: closest_point_on_shape_with_length_map(
                first.vertex_at(first.looping_vertex_count() - 1),
                second,
                lengths2_map,
            )
            .unwrap()
            .distance,
        },
        f64::INFINITY,
    )
}

// We may assume both shapes have at least 2 vertices
// When this function is called we have already checked that the length from left to right is >=
// best_distance_so_far
fn closest_shape_positions_recursion(
    shape1: &impl ShapeT,
    lengths_sh1: &[f64],
    shape2: &impl ShapeT,
    lengths_sh2: &[f64],
    left_sh1: RecursiveLineBoundary,
    right_sh1: RecursiveLineBoundary,
    best_dist_so_far: f64,
) -> Option<ClosestShapePositionsResult> {
    if best_dist_so_far == 0.0 {
        return None;
    }

    if left_sh1.vertex_index + 1 == right_sh1.vertex_index {
        let segment = LineSegment {
            start: shape1.vertex_at(left_sh1.vertex_index),
            end: shape1.vertex_at(right_sh1.vertex_index),
        };

        let closest_option = closest_linesegment_shape_position_with_length_map_recursion(
            shape2,
            lengths_sh2,
            RecursiveLineBoundary {
                vertex_index: 0,
                guaranteed_distance: closest::closest_point_on_linesegment(
                    segment,
                    shape2.vertex_at(0),
                )
                .distance,
            },
            RecursiveLineBoundary {
                vertex_index: shape2.looping_vertex_count() - 1,
                guaranteed_distance: closest::closest_point_on_linesegment(
                    segment,
                    shape2.vertex_at(shape2.linesegment_count() - 1),
                )
                .distance,
            },
            best_dist_so_far,
            &segment,
            segment.length(),
        );

        return closest_option.map(|closest| ClosestShapePositionsResult {
            distance: closest.distance,
            positions: [
                ShapePosition::new(
                    left_sh1.vertex_index,
                    closest.linesegment_fraction,
                    closest.shape_position.vec(),
                ),
                closest.shape_position,
            ],
        });
    }

    let middle_index = (right_sh1.vertex_index + left_sh1.vertex_index) / 2;
    let len_left_middle = lengths_sh1[middle_index] - lengths_sh1[left_sh1.vertex_index];
    let len_middle_right = lengths_sh1[right_sh1.vertex_index] - lengths_sh1[middle_index];

    if right_sh1.guaranteed_distance - len_middle_right >= best_dist_so_far
        || left_sh1.guaranteed_distance - len_left_middle >= best_dist_so_far
    {
        return None;
    }

    let middle_vertex = shape1.vertex_at(middle_index);
    let middle_closest_point = closest_point_on_shape_with_length_map_recursion(
        shape2,
        lengths_sh2,
        RecursiveLineBoundary {
            vertex_index: 0,
            guaranteed_distance: middle_vertex.distance(shape2.vertex_at(0)),
        },
        RecursiveLineBoundary {
            vertex_index: shape2.looping_vertex_count() - 1,
            guaranteed_distance: middle_vertex
                .distance(shape2.vertex_at(shape2.looping_vertex_count() - 1)),
        },
        f64::min(
            left_sh1.guaranteed_distance - len_left_middle,
            right_sh1.guaranteed_distance - len_middle_right,
        ),
        middle_vertex,
    )?;

    let middle = RecursiveLineBoundary {
        vertex_index: middle_index,
        guaranteed_distance: middle_closest_point.distance,
    };

    let pos_option_left = closest_shape_positions_recursion(
        shape1,
        lengths_sh1,
        shape2,
        lengths_sh2,
        left_sh1,
        middle,
        best_dist_so_far,
    );

    let Some(pos1) = &pos_option_left else {
        return closest_shape_positions_recursion(
            shape1,
            lengths_sh1,
            shape2,
            lengths_sh2,
            middle,
            right_sh1,
            best_dist_so_far,
        );
    };

    closest_shape_positions_recursion(
        shape1,
        lengths_sh1,
        shape2,
        lengths_sh2,
        middle,
        right_sh1,
        pos1.distance,
    )
    .or(pos_option_left)
}
