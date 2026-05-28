use crate::geometry::{
    algorithms::{
        closest::closest_linesegment_point::closest_point_on_linesegment,
        length_recursion::{
            index::{half_shape, initial_recursion_data, shape_cant_get_within_x},
            types::LengthRecursionData,
        },
    },
    LineSegment, ShapePosition, ShapeT, Vector,
};

pub struct ClosestPointOnShapeResult {
    pub position: ShapePosition,
    pub distance: f64,
}

pub fn closest_point_on_shape(
    point: Vector,
    shape: &impl ShapeT,
) -> Option<ClosestPointOnShapeResult> {
    let mut closest_position: Option<ShapePosition> = None;
    let mut closest_distance = f64::INFINITY;

    for (index, segment) in shape.lines().enumerate() {
        let closest = closest_point_on_linesegment(segment, point);

        if closest.distance < closest_distance {
            closest_distance = closest.distance;
            closest_position = Some(ShapePosition::new(index, closest.fraction, closest.vector));
        }
    }

    closest_position.map(|v| ClosestPointOnShapeResult {
        position: v,
        distance: closest_distance,
    })
}

pub fn closest_point_on_shape_with_length_map(
    point: Vector,
    shape: &impl ShapeT,
    lengths: &[f64],
) -> Option<ClosestPointOnShapeResult> {
    if shape.vertex_count() < 50 {
        return closest_point_on_shape(point, shape);
    }

    closest_point_on_shape_with_length_map_recursion(
        shape,
        initial_recursion_data(shape, lengths, |v| Vector::distance(point, v)),
        f64::INFINITY,
        point,
    )
}

pub fn closest_point_on_shape_with_length_map_recursion(
    shape: &impl ShapeT,
    rec_data: LengthRecursionData,
    best_dist_so_far: f64,
    point: Vector,
) -> Option<ClosestPointOnShapeResult> {
    debug_assert_eq!(shape.linesegment_count() + 1, rec_data.lengths.len());

    if shape_cant_get_within_x(&rec_data, best_dist_so_far) {
        return None;
    }

    if rec_data.left.vertex_index + 1 == rec_data.right.vertex_index {
        let seg = LineSegment {
            start: shape.vertex_at(rec_data.left.vertex_index),
            end: shape.vertex_at(rec_data.right.vertex_index),
        };

        let closest = closest_point_on_linesegment(seg, point);
        return if closest.distance < best_dist_so_far {
            Some(ClosestPointOnShapeResult {
                position: ShapePosition::new(
                    rec_data.left.vertex_index,
                    closest.fraction,
                    closest.vector,
                ),
                distance: closest.distance,
            })
        } else {
            None
        };
    } else if rec_data.left.vertex_index == rec_data.right.vertex_index {
        let distance = shape.vertex_at(rec_data.left.vertex_index).distance(point);
        return if distance < best_dist_so_far {
            Some(ClosestPointOnShapeResult {
                position: ShapePosition::new(
                    rec_data.left.vertex_index,
                    0.0,
                    shape.vertex_at(rec_data.left.vertex_index),
                ),
                distance,
            })
        } else {
            None
        };
    }

    let [left_half, right_half] = half_shape(shape, &rec_data, |v| v.distance(point));

    let pos_option_left =
        closest_point_on_shape_with_length_map_recursion(shape, left_half, best_dist_so_far, point);

    let Some(pos1) = &pos_option_left else {
        return closest_point_on_shape_with_length_map_recursion(
            shape,
            right_half,
            best_dist_so_far,
            point,
        );
    };

    closest_point_on_shape_with_length_map_recursion(shape, right_half, pos1.distance, point)
        .or(pos_option_left)
}
