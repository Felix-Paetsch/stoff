use petgraph::unionfind::UnionFind;
use std::collections::HashMap;

use crate::{
    advanced::modify_polyline_intersections::types::{ShapeGraph, ShapeGraphEdge},
    geometry::{
        ShapePosition, ShapePositionDescriptor, ShapeT, Vector,
        algorithms::intersections::find_shape_self_intersections,
    },
};

pub fn build_shape_graph(shape: &impl ShapeT) -> Option<ShapeGraph> {
    if shape.is_empty() {
        return None;
    }

    let mut intersections: Vec<ShapePosition> = find_shape_self_intersections(shape)
        .into_iter()
        .flatten()
        .collect();

    ShapePosition::sort(&mut intersections);

    let line_segments = compute_line_segments(shape, &intersections)?;
    let pre_graph =
        build_pre_shape_graph_from_intersections_end_segments(&intersections, line_segments);

    let mut graph = pre_shape_graph_to_shape_graph(pre_graph);
    reduce_multi_nodes(&mut graph);

    Some(graph)
}

struct NodeEdgeInfo {
    next_node_index: usize,
    next_node_edge_index: usize,
}

fn link_edge(next_node_index: usize, next_node_edge_index: usize) -> ShapeGraphEdge {
    ShapeGraphEdge {
        subshape: Vec::new(),
        next_node_index,
        next_node_edge_index,
    }
}

fn reduce_multi_nodes(g: &mut ShapeGraph) {
    if g.len() < 3 {
        return;
    }

    let original_len = g.len();

    for node_index in 1..original_len - 1 {
        let degree = g[node_index].len();
        if degree < 5 {
            continue;
        }

        debug_assert_eq!(degree % 2, 0, "multi-node degree must be even");

        let old_edges = std::mem::take(&mut g[node_index]);
        let pair_count = degree / 2;

        let mut split_node_indices = Vec::with_capacity(pair_count);
        split_node_indices.push(node_index);

        for _ in 1..pair_count {
            split_node_indices.push(g.len());
            g.push(Vec::new());
        }

        // For each old edge index in the original multi-node, record where it ends up:
        // old edge i -> (new_node_index, new_edge_index)
        let mut relocation = vec![(0usize, 0usize); degree];
        for pair_idx in 0..pair_count {
            let dst_node_index = split_node_indices[pair_idx];
            relocation[2 * pair_idx] = (dst_node_index, 0);
            relocation[2 * pair_idx + 1] = (dst_node_index, 1);
        }

        let mut old_edges_iter = old_edges.into_iter().enumerate();

        // Build the split nodes by moving edges, not cloning
        for pair_idx in 0..pair_count {
            let dst_node_index = split_node_indices[pair_idx];

            let (old_idx0, mut e0) = old_edges_iter.next().unwrap();
            let (old_idx1, mut e1) = old_edges_iter.next().unwrap();

            debug_assert_eq!(old_idx0, 2 * pair_idx);
            debug_assert_eq!(old_idx1, 2 * pair_idx + 1);

            let next_pair = (pair_idx + 1) % pair_count;
            let prev_pair = (pair_idx + pair_count - 1) % pair_count;

            let next_node = split_node_indices[next_pair];
            let prev_node = split_node_indices[prev_pair];

            let node_edges = vec![
                ShapeGraphEdge {
                    subshape: std::mem::take(&mut e0.subshape),
                    next_node_index: e0.next_node_index,
                    next_node_edge_index: e0.next_node_edge_index,
                },
                ShapeGraphEdge {
                    subshape: std::mem::take(&mut e1.subshape),
                    next_node_index: e1.next_node_index,
                    next_node_edge_index: e1.next_node_edge_index,
                },
                link_edge(next_node, 3),
                link_edge(prev_node, 2),
            ];

            if pair_idx == 0 {
                g[node_index] = node_edges;
            } else {
                g[dst_node_index] = node_edges;
            }
        }

        // Now patch all back-references using the relocation table.
        //
        // We can't use old_edges anymore because we consumed it, so instead we inspect
        // the newly placed external edges at [0] and [1] of each split node.
        for &dst_node_index in split_node_indices.iter() {
            for new_edge_index in 0..2 {
                let edge_next_node_index = g[dst_node_index][new_edge_index].next_node_index;
                let edge_next_node_edge_index =
                    g[dst_node_index][new_edge_index].next_node_edge_index;

                if edge_next_node_index == node_index {
                    // This means the edge originally pointed into the same multi-node.
                    // The stored edge index is still an OLD index into the original node,
                    // so remap it through relocation.
                    let old_target_edge_index = edge_next_node_edge_index;
                    let (new_target_node_index, new_target_edge_index) =
                        relocation[old_target_edge_index];

                    g[dst_node_index][new_edge_index].next_node_index = new_target_node_index;
                    g[dst_node_index][new_edge_index].next_node_edge_index = new_target_edge_index;
                } else {
                    // Counterpart is on another node; patch that node's back-reference.
                    let back = &mut g[edge_next_node_index][edge_next_node_edge_index];
                    back.next_node_index = dst_node_index;
                    back.next_node_edge_index = new_edge_index;
                }
            }
        }
    }
}

fn pre_shape_graph_to_shape_graph(mut g: ShapeGraph) -> ShapeGraph {
    if g.len() < 3 {
        return g;
    }

    for index in 1..g.len() - 1 {
        let ordering = compute_edge_ordering_permutation(&g[index]);

        let node_edge_infos_using_old_index: Vec<NodeEdgeInfo> = g[index]
            .iter()
            .map(|e| NodeEdgeInfo {
                next_node_index: e.next_node_index,
                next_node_edge_index: e.next_node_edge_index,
            })
            .collect();

        for (old_edge_index, &new_edge_index) in ordering.iter().enumerate() {
            if old_edge_index == new_edge_index {
                continue;
            }

            let other_node_index = node_edge_infos_using_old_index[old_edge_index].next_node_index;
            let other_node_edge_index =
                node_edge_infos_using_old_index[old_edge_index].next_node_edge_index;

            g[other_node_index][other_node_edge_index].next_node_edge_index = new_edge_index;
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

fn compute_edge_ordering_permutation(edges: &[ShapeGraphEdge]) -> Vec<usize> {
    let right = Vector::new(1.0, 0.0);

    let mut with_key: Vec<(usize, f64)> = edges
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
) -> ShapeGraph {
    let (identified_positions, node_count) = identify_shape_positions(intersections);
    let mut graph: ShapeGraph = (0..node_count + 2).map(|_| Vec::new()).collect();

    let segment_count = segments.len();

    for (index, mut segment) in segments.into_iter().enumerate() {
        let from_idx = if index == 0 {
            0
        } else {
            identified_positions[index - 1] + 1
        };
        let from_edge_idx = graph[from_idx].len();

        let to_idx = if index == segment_count - 1 {
            graph.len() - 1
        } else {
            identified_positions[index] + 1
        };
        let to_edge_idx = if from_idx != to_idx {
            graph[to_idx].len()
        } else {
            from_edge_idx + 1
        };

        graph[from_idx].push(ShapeGraphEdge {
            subshape: segment.clone(),
            next_node_index: to_idx,
            next_node_edge_index: to_edge_idx,
        });

        segment.reverse();
        graph[to_idx].push(ShapeGraphEdge {
            subshape: segment,
            next_node_index: from_idx,
            next_node_edge_index: from_edge_idx,
        });
    }

    graph
}

// Returns labels in 0..k-1, where positions are identified by transitive approx_equals.
fn identify_shape_positions(positions: &[ShapePosition]) -> (Vec<usize>, usize) {
    let mut uf = UnionFind::new(positions.len());

    for (i, p1) in positions.iter().enumerate() {
        for (j, p2) in positions.iter().enumerate().skip(i + 1) {
            if p1.vec().approx_equals(p2.vec()) {
                uf.union(i, j);
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
    shape: &impl ShapeT,
    intersections: &[ShapePosition],
) -> Option<Vec<Vec<Vector>>> {
    let start = ShapePosition::from_descriptor(ShapePositionDescriptor::Start, shape)?;
    let end = ShapePosition::from_descriptor(ShapePositionDescriptor::End, shape)?;

    let all_positions: Vec<&ShapePosition> = std::iter::once(&start)
        .chain(intersections.iter())
        .chain(std::iter::once(&end))
        .collect();

    let line_segments = all_positions
        .windows(2)
        .map(|window| {
            let a = window[0];
            let b = window[1];

            let mut subline = Vec::with_capacity(b.index().saturating_sub(a.index()) + 2);
            subline.push(a.vec());
            subline.extend(
                shape
                    .vertices()
                    .iter()
                    .skip(a.index() + 1)
                    .take(b.index().saturating_sub(a.index())),
            );
            subline.push(b.vec());
            subline
        })
        .collect();

    Some(line_segments)
}
