use petgraph::{Graph, Undirected};
use wasm_bindgen::prelude::*;
use wasm_wrapper_derive::WASMWrapper;

#[wasm_bindgen]
#[derive(WASMWrapper)]
pub struct WASMUnitFloat64Graph(Graph<(), f64, Undirected>);

#[wasm_bindgen]
impl WASMUnitFloat64Graph {
    pub fn new(
        node_count: usize,
        edge_endpoint_indices: Vec<usize>,
        edge_weights: Vec<f64>,
    ) -> WASMUnitFloat64Graph {
        debug_assert_eq!(edge_endpoint_indices.len(), edge_weights.len());
        debug_assert!(
            edge_endpoint_indices
                .iter()
                .copied()
                .all(|e| e < node_count * node_count)
        );

        let mut graph =
            Graph::<(), f64, Undirected>::with_capacity(node_count, edge_endpoint_indices.len());

        let nodes: Vec<_> = (0..node_count).map(|_| graph.add_node(())).collect();

        for (edge_index, weight) in edge_endpoint_indices.into_iter().zip(edge_weights) {
            let source = edge_index / node_count;
            let target = edge_index % node_count;

            graph.add_edge(nodes[source], nodes[target], weight);
        }

        WASMUnitFloat64Graph(graph)
    }
}
