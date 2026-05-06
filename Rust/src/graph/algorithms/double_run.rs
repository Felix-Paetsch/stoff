use std::collections::HashSet;

use wasm_bindgen::prelude::*;

use crate::{
    geometry::{geometry::Geometry, polygon::Polygon, vertex::Vertex},
    graph::graph::Graph,
};

pub fn double_run_graph(graph: Graph, starting_at_node: usize) -> Polygon {
    if graph.is_empty() || starting_at_node >= graph.node_count() {
        return Polygon::empty();
    }

    let start = graph.vertex_at(starting_at_node).unwrap();
    let mut path = Vec::with_capacity(2 * graph.edge_count() + 1);
    let mut visited_edges = HashSet::with_capacity(graph.edge_count());

    path.push(start);
    traverse(&graph, starting_at_node, &mut visited_edges, &mut path);

    Polygon(path)
}

fn traverse(graph: &Graph, at: usize, visited_edges: &mut HashSet<usize>, path: &mut Vec<Vertex>) {
    for edge in graph.edges_at(at) {
        if !visited_edges.insert(edge.index) {
            continue;
        }

        let [a, b] = graph.edge_endpoints(edge).unwrap();
        let next = if a.index == at { b } else { a };

        path.push(next.vec);
        traverse(graph, next.index, visited_edges, path);
        path.push(graph.vertex_at(at).unwrap());
    }
}

#[wasm_bindgen]
pub fn wasm_graph_double_run_graph(
    graph_data: &[f64],
    starting_at_node: usize,
) -> Option<Vec<f64>> {
    let graph = Graph::try_from(graph_data).ok()?;
    Some(Geometry::from(double_run_graph(graph, starting_at_node)).serialize())
}
