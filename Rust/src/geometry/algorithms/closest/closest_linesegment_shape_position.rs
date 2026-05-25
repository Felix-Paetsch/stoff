use crate::geometry::{
    algorithms::closest::{
        closest_linesegment_linesegment::closest_linesegment_points,
        closest_linesegment_point::closest_point_on_linesegment, shared::RecursiveLineBoundary,
    },
    length_map::LengthMap,
    LineSegment, ShapePosition, ShapeT,
};

pub struct ClosestLinesegmentToShapePosition {
    pub shape_position: ShapePosition,
    pub linesegment_fraction: f64,
    pub distance: f64,
}

pub fn closest_linesegment_shape_position(
    l1: &LineSegment,
    l2: &impl ShapeT,
) -> Option<ClosestLinesegmentToShapePosition> {
    let mut best: Option<ClosestLinesegmentToShapePosition> = None;

    for (index, seg2) in l2.lines().enumerate() {
        let candidate = closest_linesegment_points(l1, &seg2);

        let shape_position = ShapePosition::new(index, candidate.frac2, candidate.v2);
        let result = ClosestLinesegmentToShapePosition {
            shape_position,
            linesegment_fraction: candidate.frac1,
            distance: candidate.distance,
        };

        if best
            .as_ref()
            .is_none_or(|current| result.distance < current.distance)
        {
            best = Some(result);
        }
    }

    best
}

pub fn closest_linesegment_shape_position_with_length_map(
    ls: &LineSegment,
    shape: &impl ShapeT,
    length_map: &LengthMap,
) -> Option<ClosestLinesegmentToShapePosition> {
    if shape.vertex_count() < 50 || length_map.length() < ls.length() * 10.0 {
        return closest_linesegment_shape_position(ls, shape);
    }

    let lengths = length_map.lengths();
    closest_linesegment_shape_position_with_length_map_recursion(
        shape,
        lengths,
        RecursiveLineBoundary {
            vertex_index: 0,
            guaranteed_distance: closest_point_on_linesegment(*ls, shape.vertex_at(0)).distance,
        },
        RecursiveLineBoundary {
            vertex_index: shape.looping_vertex_count() - 1,
            guaranteed_distance: closest_point_on_linesegment(
                *ls,
                shape.vertex_at(shape.looping_vertex_count() - 1),
            )
            .distance,
        },
        f64::INFINITY,
        ls,
        ls.length(),
    )
}

pub fn closest_linesegment_shape_position_with_length_map_recursion(
    shape: &impl ShapeT,
    lengths: &[f64],
    left: RecursiveLineBoundary,
    right: RecursiveLineBoundary,
    best_dist_so_far: f64,
    segment: &LineSegment,
    segment_len: f64,
) -> Option<ClosestLinesegmentToShapePosition> {
    if best_dist_so_far == 0.0 {
        return None;
    }
    if left.vertex_index + 1 == right.vertex_index {
        let seg = LineSegment {
            start: shape.vertex_at(left.vertex_index),
            end: shape.vertex_at(right.vertex_index),
        };

        let closest = closest_linesegment_points(&seg, segment);
        return if closest.distance < best_dist_so_far {
            Some(ClosestLinesegmentToShapePosition {
                shape_position: ShapePosition::new(left.vertex_index, closest.frac1, closest.v1),
                distance: closest.distance,
                linesegment_fraction: closest.frac2,
            })
        } else {
            None
        };
    } else if left.vertex_index == right.vertex_index {
        let closest = closest_point_on_linesegment(*segment, shape.vertex_at(left.vertex_index));
        return if closest.distance < best_dist_so_far {
            Some(ClosestLinesegmentToShapePosition {
                shape_position: ShapePosition::new(left.vertex_index, 0.0, closest.vector),
                distance: closest.distance,
                linesegment_fraction: closest.fraction,
            })
        } else {
            None
        };
    }

    let middle_index = (right.vertex_index + left.vertex_index) / 2;
    let len_left_middle = lengths[middle_index] - lengths[left.vertex_index];
    let len_middle_right = lengths[right.vertex_index] - lengths[middle_index];

    if right.guaranteed_distance - len_middle_right - segment_len >= best_dist_so_far
        || left.guaranteed_distance - len_left_middle - segment_len >= best_dist_so_far
    {
        return None;
    }

    let middle_distance =
        closest_point_on_linesegment(*segment, shape.vertex_at(middle_index)).distance;
    if middle_distance - len_middle_right - segment_len >= best_dist_so_far
        || middle_distance - len_left_middle - segment_len >= best_dist_so_far
    {
        return None;
    }

    let middle = RecursiveLineBoundary {
        vertex_index: middle_index,
        guaranteed_distance: middle_distance,
    };

    let pos_option_left = closest_linesegment_shape_position_with_length_map_recursion(
        shape,
        lengths,
        left,
        middle,
        best_dist_so_far,
        segment,
        segment_len,
    );

    let Some(pos1) = &pos_option_left else {
        return closest_linesegment_shape_position_with_length_map_recursion(
            shape,
            lengths,
            middle,
            right,
            best_dist_so_far,
            segment,
            segment_len,
        );
    };

    closest_linesegment_shape_position_with_length_map_recursion(
        shape,
        lengths,
        middle,
        right,
        pos1.distance,
        segment,
        segment_len,
    )
    .or(pos_option_left)
}
