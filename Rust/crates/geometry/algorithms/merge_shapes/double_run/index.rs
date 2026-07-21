use union_find::{QuickFindUf, Union, UnionFind};

use crate::geometry::{
    Polygon, Polyline, Shape, ShapePosition, ShapeT, Vector,
    algorithms::closest::LazyClosestShapePositions,
};

pub struct DoubleRunShapeMergingConfig {
    // We will not merge things further appart than this
    pub max_merge_distance: f64,
    // When there are only so many lines left we return
    pub min_line_amount: usize,
}

impl DoubleRunShapeMergingConfig {
    pub fn new(
        max_merge_distance: Option<f64>,
        min_line_amount: Option<usize>,
    ) -> DoubleRunShapeMergingConfig {
        DoubleRunShapeMergingConfig {
            max_merge_distance: max_merge_distance.unwrap_or(f64::INFINITY),
            min_line_amount: min_line_amount.unwrap_or(1),
        }
    }
}

impl Default for DoubleRunShapeMergingConfig {
    fn default() -> Self {
        DoubleRunShapeMergingConfig {
            max_merge_distance: f64::INFINITY,
            min_line_amount: 1,
        }
    }
}

#[derive(Debug, Clone)]
struct MergePosition {
    this: usize,
    that: usize,
    own_position: ShapePosition,
}

#[allow(unused)]
pub fn double_run_merge_shapes(shapes: &[Shape]) -> Shape {
    if shapes.is_empty() {
        return Shape::Polyline(Polyline::empty());
    }
    let mut res = double_run_merge_shapes_advanced(shapes, DoubleRunShapeMergingConfig::default());
    debug_assert!(res.len() == 1);
    debug_assert!(
        res.first().unwrap().vertex_count() >= shapes.iter().map(|s| s.vertex_count()).sum()
    );
    res.pop().unwrap()
}

struct ShapeUFEntry {
    vertex_bound: usize,
}

impl Union for ShapeUFEntry {
    fn union(lval: Self, rval: Self) -> union_find::UnionResult<Self> {
        union_find::UnionResult::Left(ShapeUFEntry {
            vertex_bound: lval.vertex_bound + rval.vertex_bound + 4,
        })
    }
}

pub fn double_run_merge_shapes_advanced(
    shapes: &[Shape],
    cfg: DoubleRunShapeMergingConfig,
) -> Vec<Shape> {
    assert!(shapes.iter().all(|s| !s.is_empty()));

    let mut lazy_min_distances = LazyClosestShapePositions::new(shapes);
    let mut double_run_merge_uf = QuickFindUf::from_iter(shapes.iter().map(|s| ShapeUFEntry {
        vertex_bound: if s.is_polygon() {
            2 * s.vertex_count()
        } else {
            2 * (s.vertex_count() - 1)
        },
    }));

    let mut merge_positions: Vec<MergePosition> =
        Vec::with_capacity(2 * shapes.len().saturating_sub(cfg.min_line_amount));

    for _ in 0..shapes.len().saturating_sub(cfg.min_line_amount) {
        if let Some(min_distance_pos) = lazy_min_distances.pop()
            && min_distance_pos.2.distance <= cfg.max_merge_distance
        {
            double_run_merge_uf.union(min_distance_pos.0, min_distance_pos.1);
            lazy_min_distances
                .retain_lazy(|a, b| double_run_merge_uf.find(a) != double_run_merge_uf.find(b));

            let [pos_a, pos_b] = min_distance_pos.2.positions;
            merge_positions.push(MergePosition {
                this: min_distance_pos.0,
                that: min_distance_pos.1,
                own_position: pos_a,
            });
            merge_positions.push(MergePosition {
                this: min_distance_pos.1,
                that: min_distance_pos.0,
                own_position: pos_b,
            });
        } else {
            break;
        }
    }

    merge_positions.sort_by(|a, b| {
        a.this
            .cmp(&b.this)
            .then_with(|| a.own_position.cmp(&b.own_position))
    });

    let mut merge_position_for_shape_starts: Vec<usize> = Vec::with_capacity(shapes.len());
    let mut cursor = 0;
    for shape_idx in 0..shapes.len() {
        merge_position_for_shape_starts.push(cursor);
        while cursor < merge_positions.len() && merge_positions[cursor].this == shape_idx {
            cursor += 1;
        }
    }

    let mut output: Vec<Shape> = Vec::with_capacity(cfg.min_line_amount);
    let mut consumed_shapes_tracer: Vec<bool> = vec![false; shapes.len()];

    for i in 0..shapes.len() {
        if consumed_shapes_tracer[i] {
            continue;
        }

        let mut out_verts = Vec::with_capacity(double_run_merge_uf.get(i).vertex_bound);
        recursive_fill_vec(
            &mut out_verts,
            shapes,
            &mut consumed_shapes_tracer,
            &merge_positions,
            &merge_position_for_shape_starts,
            i,
            None,
        );

        debug_assert_eq!(out_verts.len(), double_run_merge_uf.get(i).vertex_bound);
        output.push(Shape::Polygon(Polygon::new(out_verts)));
    }

    output
}

fn recursive_fill_vec(
    res_vec: &mut Vec<Vector>,
    shapes: &[Shape],
    consumed_shapes_tracker: &mut [bool],
    merge_positions: &[MergePosition],
    first_merge_position_shape_index: &[usize],
    shape_index: usize,
    coming_from_shape: Option<usize>,
) {
    if merge_positions
        .get(first_merge_position_shape_index[shape_index])
        .map(|p| p.this != shape_index)
        .unwrap_or(true)
    {
        // There is no merge position
        let curr_shape = &shapes[shape_index];
        if curr_shape.is_polygon() {
            res_vec.extend(curr_shape.vertices().iter().chain(curr_shape.vertices()));
        } else {
            res_vec.extend(
                curr_shape
                    .vertices()
                    .iter()
                    .copied()
                    .chain(curr_shape.vertices_rev_from_to(1, curr_shape.vertex_count() - 1)),
            );
        }
        consumed_shapes_tracker[shape_index] = true;
        return;
    }

    if shapes[shape_index].is_polyline() {
        recursive_fill_vec_line(
            res_vec,
            shapes,
            consumed_shapes_tracker,
            merge_positions,
            first_merge_position_shape_index,
            shape_index,
            coming_from_shape,
        );
    } else {
        recursive_fill_vec_gon(
            res_vec,
            shapes,
            consumed_shapes_tracker,
            merge_positions,
            first_merge_position_shape_index,
            shape_index,
            coming_from_shape,
        );
    }
}

fn recursive_fill_vec_gon(
    res_vec: &mut Vec<Vector>,
    shapes: &[Shape],
    consumed_shapes_tracker: &mut [bool],
    merge_positions: &[MergePosition],
    first_merge_position_shape_index: &[usize],
    shape_index: usize,
    coming_from_shape: Option<usize>,
) {
    debug_assert!(!consumed_shapes_tracker[shape_index]);
    debug_assert!(shapes[shape_index].is_polygon());
    consumed_shapes_tracker[shape_index] = true;

    let first_merge_shape_index = first_merge_position_shape_index[shape_index];
    let last_merge_shape_index_plus_1 = first_merge_position_shape_index
        .get(shape_index + 1)
        .copied()
        .unwrap_or(merge_positions.len());

    debug_assert!(first_merge_shape_index < last_merge_shape_index_plus_1);

    let (
        start_from_merge_position,
        mut next_push_from_vert_index,
        coming_from_merge_shape_position,
        mut last_shape_position,
    ) = if let Some(cf_shape_idx) = coming_from_shape {
        let merge_pos_idx = (first_merge_shape_index..last_merge_shape_index_plus_1)
            .find(|i| merge_positions[*i].that == cf_shape_idx)
            .unwrap();
        let pos = merge_positions[merge_pos_idx].own_position;

        res_vec.push(pos.vec());
        (merge_pos_idx + 1, pos.index() + 1, Some(pos), pos)
    } else {
        (
            first_merge_shape_index,
            0,
            None,
            merge_positions[last_merge_shape_index_plus_1 - 1].own_position,
        )
    };

    let current_shape = &shapes[shape_index];
    let mut pushed_vertices = 0;

    let shape_position_amount = last_merge_shape_index_plus_1 - first_merge_shape_index;

    for merge_index in
        (0..shape_position_amount - coming_from_shape.is_some() as usize).map(|idx| {
            first_merge_shape_index
                + (start_from_merge_position - first_merge_shape_index + idx)
                    % shape_position_amount
        })
    {
        let merge_position = &merge_positions[merge_index];
        debug_assert!(merge_position.this == shape_index);
        debug_assert!(
            coming_from_shape
                .map(|u| u != merge_position.that)
                .unwrap_or(true)
        );

        if merge_position.own_position >= last_shape_position {
            res_vec.extend(current_shape.vertices_from_to(
                next_push_from_vert_index,
                merge_position.own_position.index() + 1,
            ));

            pushed_vertices += merge_position.own_position.index() + 1 - next_push_from_vert_index;
            next_push_from_vert_index = merge_position.own_position.index() + 1;
        } else {
            res_vec.extend(
                current_shape
                    .vertices_from_to(next_push_from_vert_index, current_shape.vertex_count()),
            );
            pushed_vertices += current_shape.vertex_count() - next_push_from_vert_index;
            res_vec
                .extend(current_shape.vertices_from_to(0, merge_position.own_position.index() + 1));
            pushed_vertices += merge_position.own_position.index() + 1;

            next_push_from_vert_index = merge_position.own_position.index() + 1;
        }

        res_vec.push(merge_position.own_position.vec());
        recursive_fill_vec(
            res_vec,
            shapes,
            consumed_shapes_tracker,
            merge_positions,
            first_merge_position_shape_index,
            merge_position.that,
            Some(shape_index),
        );
        res_vec.push(merge_position.own_position.vec());

        last_shape_position = merge_position.own_position;
    }

    // As we deal with a polygon we can specifiy _to_ param as larger than vert count
    res_vec.extend(current_shape.vertices_from_to(
        next_push_from_vert_index,
        next_push_from_vert_index + 2 * current_shape.vertex_count() - pushed_vertices,
    ));

    if let Some(coming_from_shape_position_unwrap) = coming_from_merge_shape_position {
        res_vec.push(coming_from_shape_position_unwrap.vec());
    }
}

fn recursive_fill_vec_line(
    res_vec: &mut Vec<Vector>,
    shapes: &[Shape],
    consumed_shapes_tracker: &mut [bool],
    merge_positions: &[MergePosition],
    first_merge_position_shape_index: &[usize],
    shape_index: usize,
    coming_from_shape: Option<usize>,
) {
    debug_assert!(!consumed_shapes_tracker[shape_index]);
    debug_assert!(shapes[shape_index].is_polyline());
    consumed_shapes_tracker[shape_index] = true;

    let first_merge_shape_index = first_merge_position_shape_index[shape_index];
    let last_merge_shape_index_plus_1 = first_merge_position_shape_index
        .get(shape_index + 1)
        .copied()
        .unwrap_or(merge_positions.len());

    debug_assert!(first_merge_shape_index < last_merge_shape_index_plus_1);

    let (
        start_from_merge_position,
        mut next_push_from_vert_index,
        coming_from_merge_shape_position,
        mut last_shape_position,
    ) = if let Some(cf_shape_idx) = coming_from_shape {
        let merge_pos_idx = (first_merge_shape_index..last_merge_shape_index_plus_1)
            .find(|i| merge_positions[*i].that == cf_shape_idx)
            .unwrap();
        let pos = merge_positions[merge_pos_idx].own_position;

        res_vec.push(pos.vec());
        (merge_pos_idx + 1, pos.index() + 1, Some(pos), pos)
    } else {
        // We start after the first position to avoid flipping confusion
        let start_pos = merge_positions[first_merge_shape_index].own_position;
        (
            first_merge_shape_index + 1,
            start_pos.index() + 1,
            None,
            start_pos,
        )
    };

    let last_vert_to_push_plus_1 = next_push_from_vert_index;

    let current_shape = &shapes[shape_index];
    let mut looped = false;

    #[cfg(debug_assertions)]
    let mut vertex_budget = 2 * (current_shape.vertex_count() - 1);

    let shape_position_amount = last_merge_shape_index_plus_1 - first_merge_shape_index;

    for merge_index in
        (0..shape_position_amount - coming_from_shape.is_some() as usize).map(|idx| {
            first_merge_shape_index
                + (start_from_merge_position - first_merge_shape_index + idx)
                    % shape_position_amount
        })
    {
        let merge_position = &merge_positions[merge_index];
        debug_assert!(merge_position.this == shape_index);
        debug_assert!(
            coming_from_shape
                .map(|u| u != merge_position.that)
                .unwrap_or(true)
        );

        if merge_position.own_position >= last_shape_position {
            res_vec.extend(current_shape.vertices_from_to(
                next_push_from_vert_index,
                merge_position.own_position.index() + 1,
            ));

            #[cfg(debug_assertions)]
            {
                vertex_budget -= merge_position.own_position.index() + 1 - next_push_from_vert_index
            }

            next_push_from_vert_index = merge_position.own_position.index() + 1;
        } else {
            debug_assert!(!looped);
            debug_assert_eq!(merge_index, first_merge_shape_index);
            res_vec.extend(
                current_shape
                    .vertices_from_to(next_push_from_vert_index, current_shape.vertex_count()),
            );
            #[cfg(debug_assertions)]
            {
                vertex_budget -= current_shape.vertex_count() - next_push_from_vert_index;
            }
            res_vec.extend(current_shape.vertices_rev_from_to(1, current_shape.vertex_count() - 1));
            #[cfg(debug_assertions)]
            {
                vertex_budget -= current_shape.vertex_count() - 2;
            }
            res_vec
                .extend(current_shape.vertices_from_to(0, merge_position.own_position.index() + 1));
            #[cfg(debug_assertions)]
            {
                vertex_budget -= merge_position.own_position.index() + 1;
            }
            next_push_from_vert_index = merge_position.own_position.index() + 1;
            looped = true;
        }

        res_vec.push(merge_position.own_position.vec());
        recursive_fill_vec(
            res_vec,
            shapes,
            consumed_shapes_tracker,
            merge_positions,
            first_merge_position_shape_index,
            merge_position.that,
            Some(shape_index),
        );
        res_vec.push(merge_position.own_position.vec());

        last_shape_position = merge_position.own_position;
    }

    if !looped {
        res_vec.extend(
            current_shape.vertices_from_to(next_push_from_vert_index, current_shape.vertex_count()),
        );
        #[cfg(debug_assertions)]
        {
            vertex_budget -= current_shape.vertex_count() - next_push_from_vert_index;
        }
        res_vec.extend(current_shape.vertices_rev_from_to(1, current_shape.vertex_count() - 1));
        #[cfg(debug_assertions)]
        {
            vertex_budget -= current_shape.vertex_count() - 2
        }
        res_vec.extend(current_shape.vertices_from_to(0, last_vert_to_push_plus_1));
        #[cfg(debug_assertions)]
        {
            vertex_budget -= last_vert_to_push_plus_1
        }
    } else {
        assert!(merge_positions[start_from_merge_position - 1].this == shape_index);
        res_vec.extend(
            current_shape.vertices_from_to(next_push_from_vert_index, last_vert_to_push_plus_1),
        );
        #[cfg(debug_assertions)]
        {
            vertex_budget -= last_vert_to_push_plus_1 - next_push_from_vert_index
        }
    }

    if let Some(coming_from_shape_position_unwrap) = coming_from_merge_shape_position {
        res_vec.push(coming_from_shape_position_unwrap.vec());
    }
    #[cfg(debug_assertions)]
    assert_eq!(vertex_budget, 0);
}
