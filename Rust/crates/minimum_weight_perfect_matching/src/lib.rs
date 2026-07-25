mod compute;

use crate::compute::max_weight_matching;
use petgraph::{Graph, Undirected, graph::NodeIndex, visit::EdgeRef};
use std::collections::HashMap;

fn discretize(value: f64) -> i128 {
    (value * 1_000_000.0).round() as i128
}

fn discretized_graph<T>(
    g: &Graph<T, f64, Undirected>,
    negate_weights: bool,
) -> Graph<(), i128, Undirected> {
    let mut new_g = Graph::<(), i128, Undirected>::with_capacity(g.node_count(), g.edge_count());

    let nodes: Vec<NodeIndex> = g.node_indices().map(|_| new_g.add_node(())).collect();
    // Keep only the maximum transformed weight for each unordered node pair.
    let mut best_edges: HashMap<(usize, usize), i128> = HashMap::new();

    for edge in g.edge_references() {
        let a = edge.source().index();
        let b = edge.target().index();
        let key = if a < b { (a, b) } else { (b, a) };

        let weight = discretize(*edge.weight());
        let weight = if negate_weights { -weight } else { weight };

        best_edges
            .entry(key)
            .and_modify(|best| *best = (*best).max(weight))
            .or_insert(weight);
    }

    for ((a, b), weight) in best_edges {
        new_g.add_edge(nodes[a], nodes[b], weight);
    }

    new_g
}

pub fn max_weight_matching_f64<T>(g: &Graph<T, f64, Undirected>) -> Vec<(usize, usize)> {
    let new_g = discretized_graph(g, false);
    max_weight_matching(&new_g, true).into_iter().collect()
}

pub fn min_weight_matching_f64<T>(g: &Graph<T, f64, Undirected>) -> Vec<(usize, usize)> {
    let new_g = discretized_graph(g, true);
    max_weight_matching(&new_g, true).into_iter().collect()
}
