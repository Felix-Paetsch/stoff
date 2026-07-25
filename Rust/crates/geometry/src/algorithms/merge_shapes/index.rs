use itertools::Either;
use union_find::UnionFind;

use crate::{
    Polygon, Polyline, Shape, ShapeT, Vector,
    algorithms::merge_shapes::{
        merge_shape_positions_provider::MergeShapePositionsProvider,
        types::{OneSidedMergePosition, ShapeEndpoint},
    },
};

pub fn merge_shapes(shapes: &[Shape]) -> Shape {
    if shapes.is_empty() {
        return Shape::Polyline(Polyline::empty());
    }
    let mut res = merge_shapes_with_options(shapes, ShapeMergingOptions::default());
    debug_assert!(res.len() == 1);
    debug_assert!(
        res.first().unwrap().vertex_count() >= shapes.iter().map(|s| s.vertex_count()).sum()
    );
    res.pop().unwrap()
}

pub struct ShapeMergingOptions {
    // We will not merge things further appart than this
    pub(super) max_merge_distance: f64,
    // When there are only so many lines left we return
    pub(super) min_line_amount: usize,
    // Fixed endpoints; provided as (ShapeIndex, is_p1)
    pub(super) fixed_endpoints: Vec<ShapeEndpoint>,
}

impl ShapeMergingOptions {
    pub fn new(
        max_merge_distance: Option<f64>,
        min_line_amount: Option<usize>,
        fixed_endpoints: Option<Vec<(usize, bool)>>,
    ) -> ShapeMergingOptions {
        let fixed_ep = fixed_endpoints.unwrap_or(vec![]);
        ShapeMergingOptions {
            max_merge_distance: max_merge_distance.unwrap_or(f64::INFINITY),
            min_line_amount: min_line_amount.unwrap_or((fixed_ep.len() / 2).max(1)),
            fixed_endpoints: fixed_ep
                .into_iter()
                .map(|e| ShapeEndpoint::new(e.0, e.1))
                .collect(),
        }
    }
}

impl Default for ShapeMergingOptions {
    fn default() -> Self {
        ShapeMergingOptions {
            max_merge_distance: f64::INFINITY,
            min_line_amount: 1,
            fixed_endpoints: vec![],
        }
    }
}

pub fn merge_shapes_with_options(shapes: &[Shape], cfg: ShapeMergingOptions) -> Vec<Shape> {
    assert!(shapes.iter().all(|s| !s.is_empty()));

    if shapes.is_empty() {
        return vec![];
    }

    if shapes.len() <= cfg.min_line_amount {
        return shapes.iter().map(|m| m.clone_to_shape()).collect();
    }

    assert!(
        cfg.fixed_endpoints
            .iter()
            .all(|ep| ep.shape_index() < shapes.len())
    );

    let mut merge_position_provider = MergeShapePositionsProvider::initialize_with_fixed_endpoints(
        shapes,
        cfg.fixed_endpoints.to_vec(),
    );

    // Approx approx when there are line ends these are extra merge positions..
    // For out usecases there is not to much harm in allocating to much I think
    let mut merge_positions: Vec<OneSidedMergePosition> = Vec::with_capacity(4 * shapes.len());

    while merge_position_provider.shape_count() > cfg.min_line_amount {
        if let Some(next_merge_position) =
            merge_position_provider.pop_if_below_distance(cfg.max_merge_distance)
        {
            assert!(
                next_merge_position
                    .0
                    .as_ref()
                    .either(|a| a.2, |b| b.distance())
                    <= cfg.max_merge_distance
            );

            let [a, b] = next_merge_position.into_one_sided_positions();
            merge_positions.push(a);
            merge_positions.push(b);
        } else {
            break;
        }
    }

    let output_shape_count = merge_position_provider.shape_count();

    // First by this and then by position
    merge_positions.sort();
    let mut merge_position_for_shape_starts: Vec<usize> = Vec::with_capacity(shapes.len());

    let mut cursor = 0;
    for shape_idx in 0..shapes.len() {
        merge_position_for_shape_starts.push(cursor);
        while cursor < merge_positions.len() && merge_positions[cursor].this == shape_idx {
            cursor += 1;
        }
    }

    let (mut shape_merge_uf, unmerged_endpoints) = merge_position_provider.into_uf_and_matching();

    // Validate the merge positions seem plausible
    // - Exactly every shape has an entry in the LookUp array for first merge pos
    // - All merge position shapes are in the same uf
    // - There as many different uf entries as the provider tells us
    // - All shapes belong to exactly one merged shape (approx by sum agreeing)
    // - All shapes vertex bounds are accounted for
    //      - be on guard about extra bounds for merge and extra bounds for looping index
    #[cfg(debug_assertions)]
    {
        debug_assert_eq!(merge_position_for_shape_starts.len(), shapes.len());
        merge_positions.iter().for_each(|mp| {
            assert!(shape_merge_uf.find(mp.this) == shape_merge_uf.find(mp.that));
        });

        let mut merged_shape_indices: Vec<_> =
            (0..shapes.len()).map(|i| shape_merge_uf.find(i)).collect();
        merged_shape_indices.sort();
        merged_shape_indices.dedup();
        debug_assert_eq!(merged_shape_indices.len(), output_shape_count);

        let mut vertex_bounds: Vec<_> = merged_shape_indices
            .iter()
            .map(|i| shape_merge_uf.get(*i).merged_vertex_bound)
            .collect();
        let mut shape_counts: Vec<usize> = vec![0; merged_shape_indices.len()];

        shapes.iter().enumerate().for_each(|(shape_index, s)| {
            let sized_position = merged_shape_indices
                .iter()
                .enumerate()
                .find(|(_, idx)| **idx == shape_merge_uf.find(shape_index))
                .map(|(j, _)| j)
                .unwrap();

            vertex_bounds[sized_position] -= s.vertex_count();
            shape_counts[sized_position] += 1;
        });

        debug_assert!(shape_counts.iter().map(|a| *a as i32).sum::<i32>() == shapes.len() as i32);
        debug_assert!(
            vertex_bounds
                .into_iter()
                .zip(shape_counts)
                .all(|(vb, sc)| vb <= 5 * sc)
        );
    }

    let mut consumed_shapes = vec![false; shapes.len()];

    let mut res: Vec<Shape> = Vec::with_capacity(output_shape_count);

    let possible_line_start_points = cfg
        .fixed_endpoints
        .into_iter()
        .chain(unmerged_endpoints.iter().flat_map(|ep| [ep.0, ep.1]));

    let polyline_iter = possible_line_start_points.filter_map(|sp: ShapeEndpoint| {
        let idx = sp.shape_index();
        if consumed_shapes[idx] {
            None
        } else {
            Some(collect_shape(
                shapes,
                &mut consumed_shapes,
                &merge_positions,
                &merge_position_for_shape_starts,
                idx,
                Some(sp),
                shape_merge_uf.get(idx).merged_vertex_bound,
            ))
        }
    });
    res.extend(polyline_iter);

    // Two lines which really shouldnt be treated as polygons for some reason are. (Or rather:
    // converted to polygons)

    let polygon_iter = (0..shapes.len()).filter_map(|shape_index| {
        if consumed_shapes[shape_index] {
            None
        } else {
            Some(collect_shape(
                shapes,
                &mut consumed_shapes,
                &merge_positions,
                &merge_position_for_shape_starts,
                shape_index,
                None,
                shape_merge_uf.get(shape_index).merged_vertex_bound,
            ))
        }
    });
    res.extend(polygon_iter);

    debug_assert_eq!(res.len(), output_shape_count);
    debug_assert!(consumed_shapes.iter().all(|b| *b));

    res
}

fn collect_shape(
    shapes: &[Shape],
    consumed_shapes_tracker: &mut [bool],
    merge_positions: &[OneSidedMergePosition],
    first_merge_position_shape_index: &[usize],
    shape_index: usize,
    as_polyline: Option<ShapeEndpoint>,
    size_hint: usize,
) -> Shape {
    debug_assert!(!consumed_shapes_tracker[shape_index]);

    let first_merge_shape_index = first_merge_position_shape_index[shape_index];
    let last_merge_shape_index_plus_1 = first_merge_position_shape_index
        .get(shape_index + 1)
        .copied()
        .unwrap_or(merge_positions.len());

    if first_merge_shape_index == last_merge_shape_index_plus_1 {
        consumed_shapes_tracker[shape_index] = true;
        if as_polyline.is_some() {
            return Shape::Polyline(shapes[shape_index].clone_to_shape().into_polyline());
        } else {
            return Shape::Polygon(shapes[shape_index].clone_to_shape().into_polygon());
        }
    }

    let mut vec: Vec<Vector> = Vec::with_capacity(size_hint);
    match as_polyline.map(|p| p.is_p1()) {
        Some(true) => {
            fill_vector_from_shape_left_to_right(
                &mut vec,
                shapes,
                consumed_shapes_tracker,
                merge_positions,
                first_merge_position_shape_index,
                shape_index,
                None,
            );

            debug_assert_eq!(vec.len(), size_hint);
            Shape::Polyline(Polyline::new(vec))
        }
        Some(false) => {
            fill_vector_from_line_right_to_left(
                &mut vec,
                shapes,
                consumed_shapes_tracker,
                merge_positions,
                first_merge_position_shape_index,
                shape_index,
            );

            debug_assert_eq!(vec.len(), size_hint);
            Shape::Polyline(Polyline::new(vec))
        }
        None => {
            fill_vector_from_shape_left_to_right(
                &mut vec,
                shapes,
                consumed_shapes_tracker,
                merge_positions,
                first_merge_position_shape_index,
                shape_index,
                None,
            );

            debug_assert_eq!(vec.len(), size_hint);
            Shape::Polygon(Polygon::new(vec))
        }
    }
}

fn recursive_fill_vector(
    vec: &mut Vec<Vector>,
    shapes: &[Shape],
    consumed_shapes_tracker: &mut [bool],
    merge_positions: &[OneSidedMergePosition],
    first_merge_position_shape_index: &[usize],
    shape_index: usize,
    coming_from_shape: Either<(usize, bool), usize>, // if merging at line ends, return the
                                                     // line end
) {
    let coming_from_merge_pos_index = match coming_from_shape {
        Either::Left((coming_from_shape_index, came_from_shape_p1)) => {
            (first_merge_position_shape_index[shape_index]..merge_positions.len())
                .find(|i| {
                    if merge_positions[*i].that != coming_from_shape_index {
                        return false;
                    }

                    if let Some((_, old_shape_is_p1)) = merge_positions[*i].position.left() {
                        return came_from_shape_p1 == old_shape_is_p1;
                    }

                    unreachable!();
                })
                .unwrap()
        }
        Either::Right(coming_from_shape_index) => {
            let index = (first_merge_position_shape_index[shape_index]..merge_positions.len())
                .find(|i| merge_positions[*i].that == coming_from_shape_index)
                .unwrap();

            debug_assert!({
                let coming_from_merge_pos = &merge_positions[index];
                coming_from_merge_pos.this == shape_index
                    && coming_from_merge_pos.that == coming_from_shape_index
                    && coming_from_merge_pos.position.is_right()
            });

            index
        }
    };

    match merge_positions[coming_from_merge_pos_index].position {
        Either::Left((true, _)) => {
            fill_vector_from_shape_left_to_right(
                vec,
                shapes,
                consumed_shapes_tracker,
                merge_positions,
                first_merge_position_shape_index,
                shape_index,
                Some(coming_from_merge_pos_index),
            );
        }
        Either::Left((false, _)) => {
            fill_vector_from_line_right_to_left(
                vec,
                shapes,
                consumed_shapes_tracker,
                merge_positions,
                first_merge_position_shape_index,
                shape_index,
            );
        }
        Either::Right(_) => {
            fill_vector_from_shape_left_to_right(
                vec,
                shapes,
                consumed_shapes_tracker,
                merge_positions,
                first_merge_position_shape_index,
                shape_index,
                Some(coming_from_merge_pos_index),
            );
        }
    }
}

fn fill_vector_from_shape_left_to_right(
    vec: &mut Vec<Vector>,
    shapes: &[Shape],
    consumed_shapes_tracker: &mut [bool],
    merge_positions: &[OneSidedMergePosition],
    first_merge_position_shape_index: &[usize],
    shape_index: usize,
    root_merge_pos_index: Option<usize>,
) {
    //
    // !! If we clean this up eventually, just store the last merge position for comparisons and so on. Compare double run
    //

    if consumed_shapes_tracker[shape_index] {
        return;
    }
    consumed_shapes_tracker[shape_index] = true;

    let first_merge_shape_index = first_merge_position_shape_index[shape_index];
    let last_merge_shape_index_plus_1 = first_merge_position_shape_index
        .get(shape_index + 1)
        .copied()
        .unwrap_or(merge_positions.len());

    debug_assert!(first_merge_shape_index < last_merge_shape_index_plus_1);
    debug_assert!(
        root_merge_pos_index
            .map(|v| first_merge_shape_index <= v)
            .unwrap_or(true)
    );
    debug_assert!(
        root_merge_pos_index
            .map(|v| last_merge_shape_index_plus_1 > v)
            .unwrap_or(true)
    );

    let current_shape = &shapes[shape_index];

    let is_base_shape = root_merge_pos_index.is_none();
    let treat_as_polygon = merge_positions[first_merge_shape_index].position.is_right()
        && merge_positions[last_merge_shape_index_plus_1 - 1]
            .position
            .is_right();

    let effective_vertex_count = if treat_as_polygon {
        current_shape.vertex_count()
    } else {
        current_shape.looping_vertex_count()
    };
    #[cfg(debug_assertions)]
    let mut vertex_budget = effective_vertex_count;

    let root_merge_position =
        root_merge_pos_index.and_then(|v| merge_positions[v].position.as_ref().right());

    // Track if we need to include the loop till the start position again
    // Only relevant if we don't start at line start; checked in the let Some and for loop
    let mut looped_once = !treat_as_polygon;
    let mut next_push_from_index = if let Some(pos) = root_merge_position {
        vec.push(pos.vec());
        pos.index() + 1
    } else {
        0
    };

    let start_traversing_from_merge_position = root_merge_pos_index
        .map(|p| p + 1)
        .unwrap_or(first_merge_shape_index);

    let shape_position_amount = last_merge_shape_index_plus_1 - first_merge_shape_index;

    // Assert that we don't skip the wrong thing in the below loop
    #[cfg(debug_assertions)]
    {
        if !is_base_shape {
            assert!(
                first_merge_shape_index
                    + (start_traversing_from_merge_position - first_merge_shape_index
                        + shape_position_amount
                        - !is_base_shape as usize)
                        % shape_position_amount
                    == root_merge_pos_index.unwrap()
            );
            assert!(consumed_shapes_tracker[merge_positions[root_merge_pos_index.unwrap()].that]);
        }
    }

    for idx in (0..shape_position_amount - !is_base_shape as usize).map(|idx| {
        first_merge_shape_index
            + (start_traversing_from_merge_position - first_merge_shape_index + idx)
                % shape_position_amount
    }) {
        let current_merge_position = merge_positions[idx].position.as_ref();

        match current_merge_position {
            Either::Left((true, _)) => {
                debug_assert!(!treat_as_polygon);
                debug_assert_eq!(idx, first_merge_shape_index);
                debug_assert!(
                    next_push_from_index == 0 || next_push_from_index == effective_vertex_count
                );

                next_push_from_index = 0;
                assert!(consumed_shapes_tracker[merge_positions[idx].that] || is_base_shape);
            }
            Either::Left((false, _)) => {
                debug_assert!(!treat_as_polygon);
                debug_assert_eq!(idx + 1, last_merge_shape_index_plus_1);

                vec.extend(
                    current_shape.vertices_from_to(next_push_from_index, effective_vertex_count),
                );

                #[cfg(debug_assertions)]
                {
                    vertex_budget -= effective_vertex_count - next_push_from_index;
                }

                next_push_from_index = effective_vertex_count;

                recursive_fill_vector(
                    vec,
                    shapes,
                    consumed_shapes_tracker,
                    merge_positions,
                    first_merge_position_shape_index,
                    merge_positions[idx].that,
                    Either::Left((shape_index, false)),
                );

                debug_assert!(!treat_as_polygon || !looped_once);
                looped_once = true;
            }
            Either::Right(pos) => {
                let vertex_index = pos.index();

                if vertex_index + 1 >= next_push_from_index
                    && !(
                        // See comment at methd start
                        // Handles the following edgecase when all merge positions are on a single edge
                        //  Single Edge: >--- x -- y -- entry ----<
                        //  Can only appear if we are on the same edge as
                        //  the root, smaller than it and there is no other
                        //  thing beforehand that also was smaller having
                        //  lead us to loop
                        vertex_index + 1 == next_push_from_index
                            && root_merge_position
                                .map(|root_pos| root_pos >= pos)
                                .unwrap_or(false)
                            && !looped_once
                    )
                {
                    vec.extend(
                        current_shape.vertices_from_to(next_push_from_index, vertex_index + 1),
                    );
                    #[cfg(debug_assertions)]
                    {
                        vertex_budget -= vertex_index + 1 - next_push_from_index;
                    }
                    next_push_from_index = vertex_index + 1;
                } else {
                    // Otherwise there would be a p2 end instead
                    assert!(current_shape.is_polygon());
                    vec.extend(
                        current_shape
                            .vertices_from_to(next_push_from_index, effective_vertex_count),
                    );
                    #[cfg(debug_assertions)]
                    {
                        vertex_budget -= effective_vertex_count - next_push_from_index;
                    }
                    vec.extend(current_shape.vertices_from_to(0, vertex_index + 1));
                    #[cfg(debug_assertions)]
                    {
                        vertex_budget -= vertex_index + 1
                    }
                    next_push_from_index = vertex_index + 1;

                    debug_assert!(!looped_once);
                    looped_once = true;
                }

                // Is false iff we are at the end of a loop
                if !consumed_shapes_tracker[merge_positions[idx].that] {
                    vec.push(pos.vec());
                    recursive_fill_vector(
                        vec,
                        shapes,
                        consumed_shapes_tracker,
                        merge_positions,
                        first_merge_position_shape_index,
                        merge_positions[idx].that,
                        Either::Right(shape_index),
                    );
                    vec.push(pos.vec());
                }
            }
        }
    }

    if let Some(root_mp) = root_merge_position {
        if (root_mp.index() + 1 >= next_push_from_index) && looped_once {
            vec.extend(current_shape.vertices_from_to(next_push_from_index, root_mp.index() + 1));
            #[cfg(debug_assertions)]
            {
                vertex_budget -= root_mp.index() + 1 - next_push_from_index
            }
        } else {
            vec.extend(
                current_shape.vertices_from_to(next_push_from_index, effective_vertex_count),
            );
            #[cfg(debug_assertions)]
            {
                vertex_budget -= effective_vertex_count - next_push_from_index;
            }
            vec.extend(current_shape.vertices_from_to(0, root_mp.index() + 1));
            #[cfg(debug_assertions)]
            {
                vertex_budget -= root_mp.index() + 1
            }
        }

        vec.push(root_mp.vec());
    } else {
        vec.extend(current_shape.vertices_from_to(next_push_from_index, effective_vertex_count));
        #[cfg(debug_assertions)]
        {
            vertex_budget -= effective_vertex_count - next_push_from_index;
        }
    }

    #[cfg(debug_assertions)]
    debug_assert_eq!(vertex_budget, 0);
    debug_assert!(
        (first_merge_shape_index..last_merge_shape_index_plus_1).all(|idx| {
            (idx == first_merge_shape_index && is_base_shape)
                || consumed_shapes_tracker[merge_positions[idx].that]
        })
    );
}

fn fill_vector_from_line_right_to_left(
    vec: &mut Vec<Vector>,
    shapes: &[Shape],
    consumed_shapes_tracker: &mut [bool],
    merge_positions: &[OneSidedMergePosition],
    first_merge_position_shape_index: &[usize],
    shape_index: usize,
) {
    if consumed_shapes_tracker[shape_index] {
        return;
    }
    consumed_shapes_tracker[shape_index] = true;

    let first_merge_shape_index = first_merge_position_shape_index[shape_index];
    let last_merge_shape_index_plus_1 = first_merge_position_shape_index
        .get(shape_index + 1)
        .copied()
        .unwrap_or(merge_positions.len());

    debug_assert!(first_merge_shape_index < last_merge_shape_index_plus_1);

    let current_shape = &shapes[shape_index];

    #[cfg(debug_assertions)]
    let mut vertex_budget = current_shape.looping_vertex_count();

    let mut already_taken_vertices = 0;
    for idx in (first_merge_shape_index..last_merge_shape_index_plus_1).rev() {
        debug_assert!(already_taken_vertices < current_shape.looping_vertex_count());
        let current_merge_position = merge_positions[idx].position.as_ref();

        match current_merge_position {
            Either::Left((true, _)) => {
                debug_assert_eq!(idx, first_merge_shape_index);

                vec.extend(current_shape.vertices_rev_from_to(
                    already_taken_vertices,
                    current_shape.looping_vertex_count(),
                ));

                #[cfg(debug_assertions)]
                {
                    vertex_budget -= current_shape.looping_vertex_count() - already_taken_vertices;
                    debug_assert_eq!(vertex_budget, 0);
                }

                recursive_fill_vector(
                    vec,
                    shapes,
                    consumed_shapes_tracker,
                    merge_positions,
                    first_merge_position_shape_index,
                    merge_positions[idx].that,
                    Either::Left((shape_index, true)),
                );

                debug_assert!(
                    (first_merge_shape_index..last_merge_shape_index_plus_1)
                        .all(|idx| { consumed_shapes_tracker[merge_positions[idx].that] })
                );

                return;
            }
            Either::Left((false, _)) => {
                debug_assert!(
                    already_taken_vertices == 0 && idx + 1 == last_merge_shape_index_plus_1
                )
            }
            Either::Right(pos) => {
                let vertex_index = pos.index();
                let extend_up_to_rev = current_shape.looping_vertex_count() - vertex_index - 1;

                vec.extend(
                    current_shape.vertices_rev_from_to(already_taken_vertices, extend_up_to_rev),
                );
                #[cfg(debug_assertions)]
                {
                    vertex_budget -= extend_up_to_rev - already_taken_vertices;
                }

                already_taken_vertices = extend_up_to_rev;

                vec.push(pos.vec());
                recursive_fill_vector(
                    vec,
                    shapes,
                    consumed_shapes_tracker,
                    merge_positions,
                    first_merge_position_shape_index,
                    merge_positions[idx].that,
                    Either::Right(shape_index),
                );
                vec.push(pos.vec());
            }
        }
    }

    debug_assert!(already_taken_vertices < current_shape.vertex_count());
    vec.extend(
        current_shape.vertices_rev_from_to(already_taken_vertices, current_shape.vertex_count()),
    );

    #[cfg(debug_assertions)]
    {
        vertex_budget -= current_shape.vertex_count() - already_taken_vertices;
        debug_assert_eq!(vertex_budget, 0)
    }

    debug_assert!(
        (first_merge_shape_index..last_merge_shape_index_plus_1)
            .all(|idx| { consumed_shapes_tracker[merge_positions[idx].that] })
    );
}
