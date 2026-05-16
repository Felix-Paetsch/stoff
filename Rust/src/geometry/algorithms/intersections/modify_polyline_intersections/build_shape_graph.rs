use petgraph::unionfind::UnionFind;
use std::collections::HashMap;

use crate::geometry::{
    algorithms::intersections::{
        modify_polyline_intersections::types::{ShapeGraph, ShapeGraphEdge},
        self_intersections::find_self_intersections,
        utils::Intersection,
    },
    polyline::Polyline,
    shape::Shape,
    shape_trait::ShapeT,
    shape_utils::shape_position::{
        shape_position_from_descriptor, ShapePosition, ShapePositionDescriptor,
    },
    vector::Vector,
};

pub fn build_shape_graph(l: &Polyline) -> Option<ShapeGraph> {
    if l.is_empty() {
        return None;
    }

    let intersections = find_self_intersections(&Shape::Polyline(l.clone()));
    let intersections = unravel_intersections(intersections);

    let line_segments = compute_line_segments(l, &intersections)?;
    let pre_shape_graph =
        build_pre_shape_graph_from_intersections_end_segments(&intersections, line_segments);

    Some(pre_shape_graph_to_shape_graph(pre_shape_graph))
}

struct NodeEdgeInfo {
    next_node_index: usize,
    next_node_edge_index: usize,
}

fn pre_shape_graph_to_shape_graph(mut g: Vec<Vec<ShapeGraphEdge>>) -> ShapeGraph {
    for index in 1..g.len() - 1 {
        let ordering = compute_edge_ordering_permutation(&g[index]);
        let node_edge_infos_using_old_index: Vec<NodeEdgeInfo> = g[index]
            .iter()
            .map(|e| NodeEdgeInfo {
                next_node_index: e.next_node_index,
                next_node_edge_index: e.next_node_edge_index,
            })
            .collect();

        for (old_edge_index, new_edge_index) in ordering.iter().enumerate() {
            if old_edge_index == *new_edge_index {
                continue;
            }

            let other_node_index = node_edge_infos_using_old_index[old_edge_index].next_node_index;
            let other_node_edge_index =
                node_edge_infos_using_old_index[old_edge_index].next_node_edge_index;

            g[other_node_index][other_node_edge_index].next_node_edge_index = *new_edge_index;
        }

        apply_permutation(&mut g[index], ordering);
    }

    g
}

fn apply_permutation<T>(items: &mut Vec<T>, old_to_new: Vec<usize>) {
    let old_items = std::mem::take(items);
    let mut old_items: Vec<Option<T>> = old_items.into_iter().map(Some).collect();

    let mut new_items = Vec::with_capacity(old_items.len());
    new_items.resize_with(old_items.len(), || None);

    for (old_index, new_index) in old_to_new.into_iter().enumerate() {
        new_items[new_index] = old_items[old_index].take();
    }

    *items = new_items.into_iter().map(Option::unwrap).collect();
}

fn compute_edge_ordering_permutation(e: &[ShapeGraphEdge]) -> Vec<usize> {
    let right = Vector::new(1.0, 0.0);

    let mut with_key: Vec<(usize, f64)> = e
        .iter()
        .enumerate()
        .map(|(index, edge)| {
            let subshape = &edge.subshape;
            if subshape.is_empty() {
                return (index, 0.0);
            }

            let start = subshape[0];
            for vector in subshape.iter().skip(1) {
                if vector.approx_equals(start) {
                    continue;
                }

                return (
                    index,
                    Vector::angle_clockwise(right, (*vector).subtract(start)),
                );
            }

            (index, 0.0)
        })
        .collect();

    with_key.sort_by(|a, b| a.1.total_cmp(&b.1));

    let mut old_to_new = vec![0; with_key.len()];
    for (new_index, (old_index, _)) in with_key.into_iter().enumerate() {
        old_to_new[old_index] = new_index;
    }

    old_to_new
}

fn build_pre_shape_graph_from_intersections_end_segments(
    intersections: &[ShapePosition],
    segments: Vec<Vec<Vector>>,
) -> Vec<Vec<ShapeGraphEdge>> {
    let (identified_positions, node_count) = identify_shape_positions(&intersections);
    let mut res: Vec<Vec<ShapeGraphEdge>> = (0..node_count + 2).map(|_| Vec::new()).collect();

    let segment_amount = segments.len();

    for (index, mut segment) in segments.into_iter().enumerate() {
        let from_idx = if index == 0 {
            0
        } else {
            identified_positions[index - 1] + 1
        };
        let from_len = res[from_idx].len();

        let to_idx = if index == segment_amount - 1 {
            res.len() - 1
        } else {
            identified_positions[index] + 1
        };
        let to_len = res[to_idx].len();

        res[from_idx].push(ShapeGraphEdge {
            subshape: segment.clone(),
            next_node_index: to_idx,
            next_node_edge_index: to_len,
        });

        segment.reverse();
        res[to_idx].push(ShapeGraphEdge {
            subshape: segment,
            next_node_index: from_idx,
            next_node_edge_index: from_len,
        });
    }

    res
}

// Returns a labeling from 0 to k-1 and k where positions are identified by transitive approx_equal
fn identify_shape_positions(s: &[ShapePosition]) -> (Vec<usize>, usize) {
    let mut uf = UnionFind::new(s.len());
    for (index1, int1) in s.iter().enumerate() {
        for (index2, int2) in s.iter().enumerate().skip(index1 + 1) {
            if int1.vec.approx_equals(int2.vec) {
                uf.union(index1, index2);
            }
        }
    }

    let labels = uf.into_labeling();

    let mut map = HashMap::<usize, usize>::new();
    let mut compact = Vec::with_capacity(labels.len());

    for rep in labels {
        let next = map.len();
        let id = *map.entry(rep).or_insert(next);
        compact.push(id);
    }

    let class_count = map.len();
    (compact, class_count)
}

pub fn compute_line_segments(
    l: &Polyline,
    intersections: &[ShapePosition],
) -> Option<Vec<Vec<Vector>>> {
    let start = shape_position_from_descriptor(ShapePositionDescriptor::Start, l)?;
    let end = shape_position_from_descriptor(ShapePositionDescriptor::End, l)?;

    let all_positions: Vec<&ShapePosition> = std::iter::once(&start)
        .chain(intersections.iter())
        .chain(std::iter::once(&end))
        .collect();

    let line_segments: Vec<Vec<Vector>> = all_positions
        .windows(2)
        .map(|window| {
            let mut subline: Vec<Vector> =
                Vec::with_capacity(window[1].start_index - window[0].start_index + 2);
            subline.push(window[0].vec);
            subline.extend(
                l.vertices()
                    .iter()
                    .skip(window[0].start_index + 1)
                    .take(window[1].start_index - window[0].start_index),
            );

            subline.push(window[1].vec);
            subline
        })
        .collect();

    Some(line_segments)
}

pub fn unravel_intersections(ints: Vec<Intersection>) -> Vec<ShapePosition> {
    let mut intersections: Vec<ShapePosition> = ints
        .into_iter()
        .flat_map(|intersection| {
            [
                ShapePosition {
                    vec: intersection.vec,
                    start_index: intersection.index_l1,
                    fraction: intersection.frac_l1,
                },
                ShapePosition {
                    vec: intersection.vec,
                    start_index: intersection.index_l2,
                    fraction: intersection.frac_l2,
                },
            ]
        })
        .collect();

    intersections.sort_by(|a, b| {
        a.start_index
            .cmp(&b.start_index)
            .then_with(|| a.fraction.total_cmp(&b.fraction))
    });
    intersections
}
