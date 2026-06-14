use petgraph::{Graph, Undirected};
use wasm_bindgen::prelude::*;

use crate::graph::algorithms::minimum_weight_perfect_matching::compute::max_weight_matching;

fn discretize(value: f64) -> i128 {
    (value * 1_000_000.0).round() as i128
}

pub fn max_weight_matching_f64<T>(g: &Graph<T, f64, Undirected>) -> Vec<(usize, usize)> {
    let new_g = g.map(|_, __| (), |_, e| discretize(*e));
    max_weight_matching(&new_g, true).into_iter().collect()
}

#[wasm_bindgen]
pub fn wasm_graph_max_weight_matching_f64(edge_node_ids: &[u32], edge_weights: &[f64]) -> Vec<u32> {
    // Edge data is: [edge1_node1_id, edge1_node2_id, edge2_node1_id, ...]; [edge1_weight,
    // edge2_weight]
    // Return type is: edge1_id, edge2_id, ...

    assert_eq!(
        edge_node_ids.len(),
        edge_weights.len() * 2,
        "edge_node_ids should have exactly 2 entries per edge"
    );

    let max_node_id = edge_node_ids.iter().max().copied().unwrap_or(0) as usize;
    let num_nodes = max_node_id + 1;

    let mut g = Graph::<(), f64, Undirected>::new_undirected();
    let nodes: Vec<_> = (0..num_nodes).map(|_| g.add_node(())).collect();

    let mut edge_map = Vec::new();
    for i in 0..edge_weights.len() {
        let u = edge_node_ids[i * 2] as usize;
        let v = edge_node_ids[i * 2 + 1] as usize;
        let w = edge_weights[i];
        let edge_idx = g.add_edge(nodes[u], nodes[v], w);
        edge_map.push(edge_idx);
    }

    let matching = max_weight_matching_f64(&g);

    let mut result = Vec::new();
    for (u, v) in &matching {
        let edge = g.find_edge(nodes[*u], nodes[*v]).expect("Edge not found");
        result.push(edge.index() as u32);
    }

    result
}
