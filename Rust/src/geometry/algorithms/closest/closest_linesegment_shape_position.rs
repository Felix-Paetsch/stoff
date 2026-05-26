use crate::geometry::{
    algorithms::{
        closest::{
            closest_linesegment_linesegment::closest_linesegment_points,
            closest_point_on_linesegment,
        },
        length_recursion::{
            index::{half_shape, initial_recursion_data, shape_cant_get_within_x},
            types::LengthRecursionData,
        },
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
        initial_recursion_data(shape, lengths, |v| {
            closest_point_on_linesegment(*ls, v).distance
        }),
        f64::INFINITY,
        ls,
    )
}

pub fn closest_linesegment_shape_position_with_length_map_recursion(
    shape: &impl ShapeT,
    rec_data: LengthRecursionData,
    best_dist_so_far: f64,
    segment: &LineSegment,
) -> Option<ClosestLinesegmentToShapePosition> {
    if shape_cant_get_within_x(&rec_data, best_dist_so_far) || best_dist_so_far == 0.0 {
        return None;
    }

    if rec_data.left.vertex_index + 1 == rec_data.right.vertex_index {
        let seg = LineSegment {
            start: shape.vertex_at(rec_data.left.vertex_index),
            end: shape.vertex_at(rec_data.right.vertex_index),
        };

        let closest = closest_linesegment_points(&seg, segment);
        return if closest.distance < best_dist_so_far {
            Some(ClosestLinesegmentToShapePosition {
                shape_position: ShapePosition::new(
                    rec_data.left.vertex_index,
                    closest.frac1,
                    closest.v1,
                ),
                distance: closest.distance,
                linesegment_fraction: closest.frac2,
            })
        } else {
            None
        };
    } else if rec_data.left.vertex_index == rec_data.right.vertex_index {
        let closest =
            closest_point_on_linesegment(*segment, shape.vertex_at(rec_data.left.vertex_index));
        return if closest.distance < best_dist_so_far {
            Some(ClosestLinesegmentToShapePosition {
                shape_position: ShapePosition::new(rec_data.left.vertex_index, 0.0, closest.vector),
                distance: closest.distance,
                linesegment_fraction: closest.fraction,
            })
        } else {
            None
        };
    }

    let [left_half, right_half] = half_shape(shape, &rec_data, |v| {
        closest_point_on_linesegment(*segment, v).distance
    });

    let pos_option_left = closest_linesegment_shape_position_with_length_map_recursion(
        shape,
        left_half,
        best_dist_so_far,
        segment,
    );

    let Some(pos1) = &pos_option_left else {
        return closest_linesegment_shape_position_with_length_map_recursion(
            shape,
            right_half,
            best_dist_so_far,
            segment,
        );
    };

    closest_linesegment_shape_position_with_length_map_recursion(
        shape,
        right_half,
        pos1.distance,
        segment,
    )
    .or(pos_option_left)
}
