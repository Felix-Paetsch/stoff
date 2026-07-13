use crate::geometry::{
    LineSegment, ShapePosition, ShapeT,
    algorithms::{
        closest::{closest_point_on_linesegment, closest_point_on_shape_with_length_map},
        intersections::utils::{
            Intersection, deduped_intersections, is_shape_end, shapes_are_parallel_at_position,
        },
        length_recursion::{
            index::{half_shape, initial_recursion_data, quater_shapes, shape_cant_get_within_x},
            types::LengthRecursionData,
        },
    },
    length_map::LengthMap,
};

pub fn find_shape_intersections(shape1: &impl ShapeT, shape2: &impl ShapeT) -> Vec<Intersection> {
    if shape1.is_empty() || shape2.is_empty() {
        return Vec::new();
    }

    let lm1 = LengthMap::new(shape1.lines());
    let lm2 = LengthMap::new(shape2.lines());

    let mut result: Vec<Intersection> = vec![];
    find_shape_intersections_recursion(
        shape1,
        initial_recursion_data(shape1, lm1.lengths(), |v| {
            closest_point_on_shape_with_length_map(v, shape1, lm1.lengths())
                .unwrap()
                .distance
        }),
        shape2,
        initial_recursion_data(shape2, lm2.lengths(), |v| {
            closest_point_on_shape_with_length_map(v, shape2, lm2.lengths())
                .unwrap()
                .distance
        }),
        &mut result,
    );

    deduped_intersections(result, lm1.lengths(), lm2.lengths(), shape1, shape2)
}

// We may assume both shapes have at least 2 vertices
pub fn find_shape_intersections_recursion(
    shape1: &impl ShapeT,
    data1: LengthRecursionData,
    shape2: &impl ShapeT,
    data2: LengthRecursionData,
    result: &mut Vec<Intersection>,
) {
    debug_assert_eq!(shape1.linesegment_count() + 1, data1.lengths.len());
    debug_assert_eq!(shape2.linesegment_count() + 1, data2.lengths.len());

    if shape_cant_get_within_x(&data1, 0.0) || shape_cant_get_within_x(&data2, 0.0) {
        return;
    }

    // Note that single points will be caught in line segment intersections somewhere
    match (
        data1.right.vertex_index - data1.left.vertex_index,
        data2.right.vertex_index - data2.left.vertex_index,
    ) {
        // Reachable via external entry e.g. with self_intersections
        (0, _) => return,
        (_, 0) => return,
        (1, 1) => {
            if let Some(int) = linesegment_linesegment_intersections(
                shape1,
                &LineSegmentRecData {
                    segment: LineSegment {
                        start: shape1.vertex_at(data1.left.vertex_index),
                        end: shape1.vertex_at(data1.right.vertex_index),
                    },
                    left_index: data1.left.vertex_index,
                    lengths: data1.lengths,
                },
                shape2,
                &LineSegmentRecData {
                    segment: LineSegment {
                        start: shape2.vertex_at(data2.left.vertex_index),
                        end: shape2.vertex_at(data2.right.vertex_index),
                    },
                    left_index: data2.left.vertex_index,
                    lengths: data2.lengths,
                },
            ) {
                result.push(int);
            }
            return;
        }
        (1, _) => {
            return linesegment_shape_intersections(
                shape1,
                &LineSegmentRecData {
                    segment: LineSegment {
                        start: shape1.vertex_at(data1.left.vertex_index),
                        end: shape1.vertex_at(data1.right.vertex_index),
                    },
                    left_index: data1.left.vertex_index,
                    lengths: data1.lengths,
                },
                shape2,
                data2,
                result,
            );
        }
        (_, 1) => {
            return linesegment_shape_intersections_flipped(
                shape2,
                &LineSegmentRecData {
                    segment: LineSegment {
                        start: shape2.vertex_at(data2.left.vertex_index),
                        end: shape2.vertex_at(data2.right.vertex_index),
                    },
                    left_index: data2.left.vertex_index,
                    lengths: data2.lengths,
                },
                shape1,
                data1,
                result,
            );
        }
        (_, _) => (),
    }

    let quatered = quater_shapes(shape1, &data1, shape2, &data2);
    quatered.into_iter().for_each(|rec_data| {
        let [first, second] = rec_data;
        find_shape_intersections_recursion(shape1, first, shape2, second, result)
    })
}

struct LineSegmentRecData<'a> {
    segment: LineSegment,
    left_index: usize,
    lengths: &'a [f64],
}

// Intersections: First belongs to linesegment, second to shape
fn linesegment_shape_intersections(
    // Shape belonging to ls
    ls_sh: &impl ShapeT,
    ls: &LineSegmentRecData,
    // Shape we want to find ls intestsection with
    sh: &impl ShapeT,
    rec_data: LengthRecursionData,
    result: &mut Vec<Intersection>,
) {
    debug_assert_eq!(sh.linesegment_count() + 1, rec_data.lengths.len());

    match rec_data.right.vertex_index - rec_data.left.vertex_index {
        1 => {
            if let Some(int) = linesegment_linesegment_intersections(
                ls_sh,
                ls,
                sh,
                &LineSegmentRecData {
                    segment: LineSegment {
                        start: sh.vertex_at(rec_data.left.vertex_index),
                        end: sh.vertex_at(rec_data.right.vertex_index),
                    },
                    left_index: rec_data.left.vertex_index,
                    lengths: rec_data.lengths,
                },
            ) {
                result.push(int);
            }

            return;
        }
        0 => unreachable!(),
        _ => (),
    };

    let halfed = half_shape(sh, &rec_data, |v| {
        closest_point_on_linesegment(ls.segment, v).distance
    });

    halfed
        .into_iter()
        .for_each(|rec_data| linesegment_shape_intersections(ls_sh, ls, sh, rec_data, result))
}

// Intersections: second belongs to linesegment, first to shape
fn linesegment_shape_intersections_flipped(
    // Shape belonging to ls
    ls_sh: &impl ShapeT,
    ls: &LineSegmentRecData,
    // Shape we want to find ls intestsection with
    sh: &impl ShapeT,
    rec_data: LengthRecursionData,
    result: &mut Vec<Intersection>,
) {
    debug_assert_eq!(sh.linesegment_count() + 1, rec_data.lengths.len());

    match rec_data.right.vertex_index - rec_data.left.vertex_index {
        1 => {
            if let Some(int) = linesegment_linesegment_intersections(
                sh,
                &LineSegmentRecData {
                    segment: LineSegment {
                        start: sh.vertex_at(rec_data.left.vertex_index),
                        end: sh.vertex_at(rec_data.right.vertex_index),
                    },
                    left_index: rec_data.left.vertex_index,
                    lengths: rec_data.lengths,
                },
                ls_sh,
                ls,
            ) {
                result.push(int);
            }

            return;
        }
        0 => unreachable!(),
        _ => (),
    };

    let halfed = half_shape(sh, &rec_data, |v| {
        closest_point_on_linesegment(ls.segment, v).distance
    });

    halfed
        .into_iter()
        .for_each(|rec_data| linesegment_shape_intersections(ls_sh, ls, sh, rec_data, result))
}

fn linesegment_linesegment_intersections(
    shape1: &impl ShapeT,
    ls1: &LineSegmentRecData,
    shape2: &impl ShapeT,
    ls2: &LineSegmentRecData,
) -> Option<Intersection> {
    if let Some(pt) = LineSegment::intersection(&ls1.segment, &ls2.segment) {
        let frac1 = ls1
            .segment
            .try_inverse_lerp(pt)
            .map(|v| v.clamp(0.0, 1.0))
            .unwrap_or(0.5);
        let frac2 = ls2
            .segment
            .try_inverse_lerp(pt)
            .map(|v| v.clamp(0.0, 1.0))
            .unwrap_or(0.5);

        let p1 = ShapePosition::new(ls1.left_index, frac1, pt);
        let p2 = ShapePosition::new(ls2.left_index, frac2, pt);

        debug_assert!(p1.belongs_to_shape(shape1));
        debug_assert!(p2.belongs_to_shape(shape2));

        if is_shape_end(p1, ls1.lengths, shape1)
            || is_shape_end(p2, ls2.lengths, shape2)
            || !shapes_are_parallel_at_position(shape1, p1, shape2, p2)
        {
            Some([p1, p2])
        } else {
            None
        }
    } else {
        None
    }
}
