use crate::{
    // debug::*,
    geometry::{
        algorithms::{
            closest::{
                closest_linesegment_points,
                closest_linesegment_shape_position::closest_linesegment_shape_position_with_length_map_recursion,
                closest_point_on_shape_with_length_map,
            },
            length_recursion::{
                index::{initial_recursion_data, quater_shapes, shape_cant_get_within_x},
                types::LengthRecursionData,
            },
        },
        length_map::LengthMap,
        LineSegment, ShapePosition, ShapeT, Vector,
    },
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

    let lm1 = LengthMap::new(shape1.lines());
    let lm2 = LengthMap::new(shape2.lines());

    closest_shape_positions_with_length_maps(shape1, lm1.lengths(), shape2, lm2.lengths())
}

pub fn closest_shape_positions_with_length_maps(
    shape1: &impl ShapeT,
    lengths1: &[f64],
    shape2: &impl ShapeT,
    lengths2: &[f64],
) -> Option<ClosestShapePositionsResult> {
    debug_assert!(!shape1.is_empty() && !shape2.is_empty());

    let closest = closest_shape_positions_recursion(
        shape1,
        initial_recursion_data(shape1, lengths1, |v| {
            closest_point_on_shape_with_length_map(v, shape2, lengths2)
                .unwrap()
                .distance
        }),
        shape2,
        initial_recursion_data(shape2, lengths2, |v| {
            closest_point_on_shape_with_length_map(v, shape1, lengths1)
                .unwrap()
                .distance
        }),
        f64::INFINITY,
    );
    debug_assert!(closest.is_some());
    closest
}

pub fn closest_shape_positions_recursion(
    shape1: &impl ShapeT,
    data1: LengthRecursionData,
    shape2: &impl ShapeT,
    data2: LengthRecursionData,
    best_dist_so_far: f64,
) -> Option<ClosestShapePositionsResult> {
    debug_assert_eq!(shape1.linesegment_count() + 1, data1.lengths.len());
    debug_assert!(data1.left.vertex_index <= data1.right.vertex_index);
    debug_assert!(data1.right.vertex_index < shape1.looping_vertex_count());
    debug_assert_eq!(shape2.linesegment_count() + 1, data2.lengths.len());
    debug_assert!(data2.left.vertex_index <= data2.right.vertex_index);
    debug_assert!(data2.right.vertex_index < shape2.looping_vertex_count());

    if shape_cant_get_within_x(&data1, best_dist_so_far)
        || shape_cant_get_within_x(&data2, best_dist_so_far)
        || best_dist_so_far == 0.0
    {
        return None;
    }

    // Note that single points will be caught in line segment intersections somewhere
    match (
        data1.right.vertex_index - data1.left.vertex_index,
        data2.right.vertex_index - data2.left.vertex_index,
    ) {
        (1, 1) => {
            let closest = closest_linesegment_points(
                &LineSegment {
                    start: shape1.vertex_at(data1.left.vertex_index),
                    end: shape1.vertex_at(data1.right.vertex_index),
                },
                &LineSegment {
                    start: shape2.vertex_at(data2.left.vertex_index),
                    end: shape2.vertex_at(data2.right.vertex_index),
                },
            );

            if closest.distance >= best_dist_so_far {
                return None;
            }

            return Some(ClosestShapePositionsResult {
                positions: [
                    ShapePosition::new(data1.left.vertex_index, closest.frac1, closest.v1),
                    ShapePosition::new(data2.left.vertex_index, closest.frac2, closest.v2),
                ],
                distance: closest.distance,
            });
        }
        (1, _) => {
            let segment = LineSegment {
                start: shape1.vertex_at(data1.left.vertex_index),
                end: shape1.vertex_at(data1.right.vertex_index),
            };

            let closest = closest_linesegment_shape_position_with_length_map_recursion(
                shape2,
                data2,
                best_dist_so_far,
                &segment,
            );

            debug_assert!(closest
                .as_ref()
                .map(|c| c.distance < best_dist_so_far)
                .unwrap_or(true));

            return closest.map(|c| ClosestShapePositionsResult {
                positions: [
                    ShapePosition::new(
                        data1.left.vertex_index,
                        c.linesegment_fraction,
                        Vector::lerp(
                            shape1.vertex_at(data1.left.vertex_index),
                            shape1.vertex_at(data1.left.vertex_index + 1),
                            c.linesegment_fraction,
                        ),
                    ),
                    c.shape_position,
                ],
                distance: c.distance,
            });
        }
        (_, 1) => {
            let segment = LineSegment {
                start: shape2.vertex_at(data2.left.vertex_index),
                end: shape2.vertex_at(data2.right.vertex_index),
            };

            let closest = closest_linesegment_shape_position_with_length_map_recursion(
                shape1,
                data1,
                best_dist_so_far,
                &segment,
            );

            debug_assert!(closest
                .as_ref()
                .map(|c| c.distance < best_dist_so_far)
                .unwrap_or(true));

            return closest.map(|c| ClosestShapePositionsResult {
                positions: [
                    c.shape_position,
                    ShapePosition::new(
                        data2.left.vertex_index,
                        c.linesegment_fraction,
                        Vector::lerp(
                            shape2.vertex_at(data2.left.vertex_index),
                            shape2.vertex_at(data2.left.vertex_index + 1),
                            c.linesegment_fraction,
                        ),
                    ),
                ],
                distance: c.distance,
            });
        }
        // Only reachable via external entry
        (0, _) => return None,
        (_, 0) => return None,
        (_, _) => (),
    }

    let quatered = quater_shapes(shape1, &data1, shape2, &data2);
    let mut best_dist = best_dist_so_far;
    let mut best: Option<ClosestShapePositionsResult> = None;

    for [shape1_rec_data, shape2_rec_data] in quatered.into_iter() {
        let potential_new_best = closest_shape_positions_recursion(
            shape1,
            shape1_rec_data,
            shape2,
            shape2_rec_data,
            best_dist,
        );
        if let Some(new_best) = potential_new_best {
            assert!(new_best.distance < best_dist);

            best_dist = new_best.distance;
            best = Some(new_best);
        }
    }

    best
}
