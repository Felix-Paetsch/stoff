use petgraph::{
    graph::{Graph, NodeIndex},
    visit::EdgeRef,
    Undirected,
};
use std::collections::HashSet;
use wasm_bindgen::prelude::*;

use crate::vertex::Vertex;

use super::graph_compatibility_layer::{vecf64_to_undirected_graph, vertex_vec_to_vecf64};

#[wasm_bindgen]
pub fn double_run_graph(graph_data: &[f64], starting_at_node: u32) -> Option<Vec<f64>> {
    let g = vecf64_to_undirected_graph(graph_data)?;

    let mut ret_vertices: Vec<Vertex> = Vec::with_capacity(2 * (g.edge_count() * 2 + 1));
    ret_vertices.push(*g.node_weight(NodeIndex::new(starting_at_node as usize))?);

    // console::log_1(&JsValue::from_str(&format!("{:?}", g)));

    recurse(
        &g,
        &mut HashSet::new(),
        &mut ret_vertices,
        NodeIndex::new(starting_at_node as usize),
    );

    Some(vertex_vec_to_vecf64(&ret_vertices))
}

fn recurse(
    graph: &Graph<Vertex, (), Undirected>,
    visited_edges: &mut HashSet<usize>,
    path: &mut Vec<Vertex>,
    at: NodeIndex,
) {
    for edge in graph.edges(at) {
        if !visited_edges.contains(&edge.id().index()) {
            visited_edges.insert(edge.id().index());

            let endpoints = graph.edge_endpoints(edge.id()).unwrap();

            if endpoints.0.index() == at.index() {
                path.push(*graph.node_weight(endpoints.1).unwrap());
                recurse(graph, visited_edges, path, endpoints.1);
            } else {
                path.push(*graph.node_weight(endpoints.0).unwrap());
                recurse(graph, visited_edges, path, endpoints.0);
            }

            path.push(*graph.node_weight(at).unwrap());
        }
    }
}
