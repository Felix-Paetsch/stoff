use itertools::Itertools;
use union_find::UnionFind;

use crate::{
    geometry::{
        algorithms::merge_shapes::{
            merge_shape_positions_provider::MergeShapePositionsProvider,
            types::{MergePosition, OneSidedMergePosition, ShapeEndpoint},
        },
        utils::distance_graph::distance_graph,
        Polyline, Shape, ShapeT, Vector,
    },
    graph::algorithms::minimum_weight_perfect_matching::min_weight_matching_f64,
};

pub fn merge_shapes(shapes: &[Shape]) -> Shape {
    merge_shapes_advanced(shapes, ShapeMergingConfig::default())
        .pop()
        .unwrap()
}

pub struct ShapeMergingConfig {
    // We will not merge things further appart than this
    max_merge_distance: f64,
    // When there are only so many lines left we return
    min_line_amount: usize,
    // Fixed endpoints
    fixed_endpoints: Vec<ShapeEndpoint>,
}

impl ShapeMergingConfig {
    pub fn new(
        max_merge_distance: Option<f64>,
        min_line_amount: Option<usize>,
        fixed_endpoints: Option<Vec<ShapeEndpoint>>,
    ) -> ShapeMergingConfig {
        let fixed_ep = fixed_endpoints.unwrap_or(vec![]);
        ShapeMergingConfig {
            max_merge_distance: max_merge_distance.unwrap_or(f64::INFINITY),
            min_line_amount: min_line_amount.unwrap_or((fixed_ep.len() / 2).max(1)),
            fixed_endpoints: fixed_ep,
        }
    }
}

impl Default for ShapeMergingConfig {
    fn default() -> Self {
        ShapeMergingConfig {
            max_merge_distance: f64::INFINITY,
            min_line_amount: 1,
            fixed_endpoints: vec![],
        }
    }
}

pub fn merge_shapes_advanced<'a>(shapes: &'a [Shape], cfg: ShapeMergingConfig) -> Vec<Shape> {
    debug_assert!(shapes.iter().all(|s| !s.is_empty()));

    if shapes.is_empty() {
        return vec![Shape::Polyline(Polyline::empty())];
    }

    if shapes.len() <= cfg.min_line_amount {
        return shapes.iter().map(|m| m.clone_to_shape()).collect();
    }

    let mut merge_position_provider = MergeShapePositionsProvider::initialize_with_fixed_endpoints(
        shapes,
        cfg.fixed_endpoints.iter().copied().collect(),
    );

    let mut merge_positions: Vec<OneSidedMergePosition> =
        Vec::with_capacity(2 * (shapes.len() - cfg.min_line_amount));

    for _ in 0..(shapes.len() - cfg.min_line_amount) {
        if let Some(next_merge_position) = merge_position_provider.pop() {
            if next_merge_position.distance() > cfg.max_merge_distance {
                break;
            }
            let [a, b] = next_merge_position.into_one_sided_positions();
            merge_positions.push(a);
            merge_positions.push(b);
        } else {
            break;
        };
    }

    // First by this and then by position
    merge_positions.sort_by(|a, b| a.cmp(&b));
    let mut merge_position_for_shape_starts: Vec<usize> = Vec::with_capacity(shapes.len());

    let mut current_shape_index = 0;
    for (i, p) in merge_positions.iter().enumerate() {
        let p_shape1_idx = p.this;
        while p_shape1_idx >= current_shape_index {
            merge_position_for_shape_starts.push(i);
            current_shape_index += 1;
        }
    }

    debug_assert_eq!(merge_position_for_shape_starts.len(), shapes.len());

    let (mut shape_merge_uf, unmerged_endpoints) = merge_position_provider.into_uf_and_matching();
    let possible_line_start_points = cfg
        .fixed_endpoints
        .into_iter()
        .chain(unmerged_endpoints.iter().flat_map(|ep| [ep.0, ep.1]));

    let mut consumed_shapes = vec![false; shapes.len()];

    let mut res: Vec<Shape> = Vec::with_capacity(shapes.len() - (merge_positions.len() / 2));

    let polyline_iter = possible_line_start_points.filter_map(|sp| {
        let idx = sp.shape_index();
        if consumed_shapes[idx] {
            None
        } else {
            Some(collect_polyline(
                shapes,
                &mut consumed_shapes,
                &merge_positions,
                &merge_position_for_shape_starts,
                idx,
                shape_merge_uf.get(idx).merged_vertex_bound,
            ))
        }
    });
    res.extend(polyline_iter);

    let polygon_iter = (0..shapes.len()).filter_map(|shape_index| {
        if consumed_shapes[shape_index] {
            None
        } else {
            Some(collect_polygon(
                shapes,
                &mut consumed_shapes,
                &merge_positions,
                &merge_position_for_shape_starts,
                shape_index,
                shape_merge_uf.get(shape_index).merged_vertex_bound,
            ))
        }
    });
    res.extend(polygon_iter);

    debug_assert!(consumed_shapes.iter().all(|b| *b));

    res
}

fn collect_polyline(
    shapes: &[Shape],
    // Todo: make this unmutable?
    mut consumed_shapes_tracker: &mut [bool],
    merge_positions: &[OneSidedMergePosition],
    first_merge_position_shape_index: &[usize],
    shape_index: usize,
    size_hint: usize,
) -> Shape {
    assert!(!consumed_shapes_tracker[shape_index]);

    consumed_shapes_tracker[shape_index] = true;

    let mut res_vec: Vec<Vector> = Vec::with_capacity(size_hint);

    let first_merge_shape_index = first_merge_position_shape_index[shape_index];
    let last_merge_shape_index_plus_1 = first_merge_position_shape_index
        .get(shape_index + 1)
        .copied()
        .unwrap_or(merge_positions.len());

    if first_merge_shape_index == last_merge_shape_index_plus_1 {
        return shapes[shape_index].clone_to_shape();
    }

    let current_shape = &shapes[shape_index];
    let mut already_taken_vertices = 0;

    for idx in first_merge_shape_index..last_merge_shape_index_plus_1 {
        // The last index should never be appended here as it comes after all possible shape
        // positions
        assert!(already_taken_vertices < shapes[shape_index].vertex_count());

        let current_merge_position = merge_positions[idx].position.as_ref();

        current_merge_position.either_with(
            (
                &mut consumed_shapes_tracker,
                &mut res_vec,
                &mut already_taken_vertices,
            ),
            |(consumed_shapes_tracker, mut res_vec, already_taken_vertices), b| {
                assert!(!*b);
                assert_eq!(idx + 1, last_merge_shape_index_plus_1);

                res_vec.extend(
                    current_shape
                        .vertices_from_to(*already_taken_vertices, current_shape.vertex_count()),
                );
                // To avoid the extra point creation after the loop
                *already_taken_vertices = current_shape.vertex_count();

                recursive_fill_vector(
                    &mut res_vec,
                    shapes,
                    consumed_shapes_tracker,
                    merge_positions,
                    first_merge_position_shape_index,
                    merge_positions[idx].that,
                    shape_index,
                );
            },
            |(consumed_shapes_tracker, mut res_vec, already_taken_vertices), pos| {
                let vertex_index = pos.index();
                res_vec.extend(
                    current_shape.vertices_from_to(*already_taken_vertices, vertex_index + 1),
                );
                *already_taken_vertices = vertex_index + 1;

                recursive_fill_vector(
                    &mut res_vec,
                    shapes,
                    consumed_shapes_tracker,
                    merge_positions,
                    first_merge_position_shape_index,
                    merge_positions[idx].that,
                    shape_index,
                );
            },
        )
    }

    res_vec.extend(
        current_shape.vertices_from_to(already_taken_vertices, current_shape.vertex_count()),
    );

    assert!(res_vec.len() <= size_hint);
    Shape::Polyline(Polyline::new(res_vec))
}

fn collect_polygon(
    shapes: &[Shape],
    consumed_shapes_tracker: &mut [bool],
    merge_positions: &[OneSidedMergePosition],
    first_merge_position_shape_index: &[usize],
    shape_index: usize,
    size_hint: usize,
) -> Shape {
    todo!();
}

fn recursive_fill_vector(
    vec: &mut Vec<Vector>,
    shapes: &[Shape],
    consumed_shapes_tracker: &mut [bool],
    merge_positions: &[OneSidedMergePosition],
    first_merge_position_shape_index: &[usize],
    shape_index: usize,
    comming_from_shape_index: usize,
) {
}
