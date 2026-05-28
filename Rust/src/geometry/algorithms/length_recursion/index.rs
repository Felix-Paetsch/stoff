use crate::geometry::{
    algorithms::{
        closest,
        length_recursion::types::{LengthRecursionData, RecursiveLineBoundary},
    },
    ShapeT, Vector,
};

pub fn shape_cant_get_within_x(rec_data: &LengthRecursionData, amt: f64) -> bool {
    let shape_len = rec_data.lengths[rec_data.right.vertex_index]
        - rec_data.lengths[rec_data.left.vertex_index];
    let min_dists = rec_data.left.guaranteed_distance + rec_data.right.guaranteed_distance;

    min_dists - shape_len > 2.0 * amt
}

pub fn initial_recursion_data<'a, F>(
    s: &impl ShapeT,
    lengths: &'a [f64],
    f: F,
) -> LengthRecursionData<'a>
where
    F: Fn(Vector) -> f64,
{
    debug_assert!(!s.is_empty());
    debug_assert_eq!(s.linesegment_count() + 1, lengths.len());

    LengthRecursionData {
        lengths,
        left: RecursiveLineBoundary {
            vertex_index: 0,
            guaranteed_distance: f(s.vertex_at(0)),
        },
        right: RecursiveLineBoundary {
            vertex_index: s.looping_vertex_count() - 1,
            guaranteed_distance: f(s.vertex_at(s.looping_vertex_count() - 1)),
        },
    }
}

pub fn half_shape<'a, F>(
    s: &impl ShapeT,
    rec_data: &LengthRecursionData<'a>,
    f: F,
) -> [LengthRecursionData<'a>; 2]
where
    F: Fn(Vector) -> f64,
{
    debug_assert!(rec_data.right.vertex_index - rec_data.left.vertex_index >= 2);
    debug_assert!(rec_data.lengths.len() > rec_data.right.vertex_index);
    debug_assert_eq!(s.linesegment_count() + 1, rec_data.lengths.len());

    let middle_index = (rec_data.right.vertex_index + rec_data.left.vertex_index) / 2;
    let middle_vec = s.vertex_at(middle_index);
    let distance = f(middle_vec);

    let middle_boundary = RecursiveLineBoundary {
        vertex_index: middle_index,
        guaranteed_distance: distance,
    };

    [
        LengthRecursionData {
            lengths: rec_data.lengths,
            left: rec_data.left,
            right: middle_boundary,
        },
        LengthRecursionData {
            lengths: rec_data.lengths,
            left: middle_boundary,
            right: rec_data.right,
        },
    ]
}

pub fn quater_shapes<'a>(
    s1: &impl ShapeT,
    rec_data1: &LengthRecursionData<'a>,
    s2: &impl ShapeT,
    rec_data2: &LengthRecursionData<'a>,
) -> [[LengthRecursionData<'a>; 2]; 4] {
    debug_assert!(rec_data1.right.vertex_index - rec_data1.left.vertex_index >= 2);
    debug_assert!(rec_data2.right.vertex_index - rec_data2.left.vertex_index >= 2);
    debug_assert!(rec_data1.right.vertex_index > rec_data1.left.vertex_index);
    debug_assert!(rec_data2.right.vertex_index > rec_data2.left.vertex_index);
    debug_assert!(rec_data1.lengths.len() > rec_data1.right.vertex_index);
    debug_assert!(rec_data2.lengths.len() > rec_data2.right.vertex_index);
    debug_assert_eq!(s1.linesegment_count() + 1, rec_data1.lengths.len());
    debug_assert_eq!(s2.linesegment_count() + 1, rec_data2.lengths.len());

    let middle_index_1 = (rec_data1.right.vertex_index + rec_data1.left.vertex_index) / 2;
    let middle_index_2 = (rec_data2.right.vertex_index + rec_data2.left.vertex_index) / 2;
    let middle_vertex_1 = s1.vertex_at(middle_index_1);
    let middle_vertex_2 = s2.vertex_at(middle_index_2);
    let middle_vertex_dist = middle_vertex_1.distance(middle_vertex_2);

    let guaranteed_middle_distance_middle_1_part_2_1 =
        closest::closest_point_on_shape_with_length_map_recursion(
            s2,
            LengthRecursionData {
                lengths: rec_data2.lengths,
                left: rec_data2.left,
                right: RecursiveLineBoundary {
                    vertex_index: middle_index_2,
                    guaranteed_distance: middle_vertex_dist,
                },
            },
            f64::INFINITY,
            middle_vertex_1,
        )
        .unwrap()
        .distance;

    let guaranteed_middle_distance_middle_1_part_2_2 =
        closest::closest_point_on_shape_with_length_map_recursion(
            s2,
            LengthRecursionData {
                lengths: rec_data2.lengths,
                left: RecursiveLineBoundary {
                    vertex_index: middle_index_2,
                    guaranteed_distance: middle_vertex_dist,
                },
                right: rec_data2.right,
            },
            f64::INFINITY,
            middle_vertex_1,
        )
        .unwrap()
        .distance;

    let guaranteed_middle_distance_middle_2_part_1_1 =
        closest::closest_point_on_shape_with_length_map_recursion(
            s1,
            LengthRecursionData {
                lengths: rec_data1.lengths,
                left: rec_data1.left,
                right: RecursiveLineBoundary {
                    vertex_index: middle_index_1,
                    guaranteed_distance: middle_vertex_dist,
                },
            },
            f64::INFINITY,
            middle_vertex_2,
        )
        .unwrap()
        .distance;

    let guaranteed_middle_distance_middle_2_part_1_2 =
        closest::closest_point_on_shape_with_length_map_recursion(
            s1,
            LengthRecursionData {
                lengths: rec_data1.lengths,
                left: RecursiveLineBoundary {
                    vertex_index: middle_index_1,
                    guaranteed_distance: middle_vertex_dist,
                },
                right: rec_data1.right,
            },
            f64::INFINITY,
            middle_vertex_2,
        )
        .unwrap()
        .distance;

    [
        [
            LengthRecursionData {
                lengths: rec_data1.lengths,
                left: rec_data1.left,
                right: RecursiveLineBoundary {
                    vertex_index: middle_index_1,
                    guaranteed_distance: guaranteed_middle_distance_middle_1_part_2_1,
                },
            },
            LengthRecursionData {
                lengths: rec_data2.lengths,
                left: rec_data2.left,
                right: RecursiveLineBoundary {
                    vertex_index: middle_index_2,
                    guaranteed_distance: guaranteed_middle_distance_middle_2_part_1_1,
                },
            },
        ],
        [
            LengthRecursionData {
                lengths: rec_data1.lengths,
                left: rec_data1.left,
                right: RecursiveLineBoundary {
                    vertex_index: middle_index_1,
                    guaranteed_distance: guaranteed_middle_distance_middle_1_part_2_2,
                },
            },
            LengthRecursionData {
                lengths: rec_data2.lengths,
                left: RecursiveLineBoundary {
                    vertex_index: middle_index_2,
                    guaranteed_distance: guaranteed_middle_distance_middle_2_part_1_1,
                },
                right: rec_data2.right,
            },
        ],
        [
            LengthRecursionData {
                lengths: rec_data1.lengths,
                left: RecursiveLineBoundary {
                    vertex_index: middle_index_1,
                    guaranteed_distance: guaranteed_middle_distance_middle_1_part_2_1,
                },
                right: rec_data1.right,
            },
            LengthRecursionData {
                lengths: rec_data2.lengths,
                left: rec_data2.left,
                right: RecursiveLineBoundary {
                    vertex_index: middle_index_2,
                    guaranteed_distance: guaranteed_middle_distance_middle_2_part_1_2,
                },
            },
        ],
        [
            LengthRecursionData {
                lengths: rec_data1.lengths,
                left: RecursiveLineBoundary {
                    vertex_index: middle_index_1,
                    guaranteed_distance: guaranteed_middle_distance_middle_1_part_2_2,
                },
                right: rec_data1.right,
            },
            LengthRecursionData {
                lengths: rec_data2.lengths,
                left: RecursiveLineBoundary {
                    vertex_index: middle_index_2,
                    guaranteed_distance: guaranteed_middle_distance_middle_2_part_1_2,
                },
                right: rec_data2.right,
            },
        ],
    ]
}
