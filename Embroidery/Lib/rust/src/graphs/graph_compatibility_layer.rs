use petgraph::graph::{Graph, NodeIndex};
use petgraph::visit::EdgeRef;
use petgraph::Undirected;

use crate::vertex::Vertex;

// A graph is encoded as follows:
// [#num vertices, v1x, v1y, v2x, v2y, ..., edge1Start, edge1End, edge2Start, ...]
pub fn vecf64_to_undirected_graph(coords: &[f64]) -> Graph<Vertex, (), Undirected> {
    let num_vertices = coords[0] as usize;
    let vertex_data_len = 1 + num_vertices * 2;

    let mut graph = Graph::<Vertex, (), Undirected>::new_undirected();
    let mut nodes = Vec::<NodeIndex>::with_capacity(num_vertices);

    for i in 0..num_vertices {
        let x = coords[1 + 2 * i];
        let y = coords[1 + 2 * i + 1];

        let node = graph.add_node(Vertex { x, y });
        nodes.push(node);
    }

    let edge_start = vertex_data_len;

    for i in (edge_start..coords.len()).step_by(2) {
        let a_f = coords[i];
        let b_f = coords[i + 1];

        let a = a_f as usize;
        let b = b_f as usize;

        graph.add_edge(nodes[a], nodes[b], ());
    }

    graph
}

// Encodes an undirected graph as:
// [#num vertices, v1x, v1y, v2x, v2y, ..., edge1Start, edge1End, edge2Start, edge2End, ...]
pub fn undirected_graph_to_vecf64(graph: &Graph<Vertex, (), Undirected>) -> Vec<f64> {
    let node_count = graph.node_count();
    let mut out = Vec::with_capacity(1 + node_count * 2 + graph.edge_count() * 2);

    out.push(node_count as f64);

    for node_idx in graph.node_indices() {
        let v = graph[node_idx];
        out.push(v.x);
        out.push(v.y);
    }

    for edge in graph.edge_references() {
        out.push(edge.source().index() as f64);
        out.push(edge.target().index() as f64);
    }

    out
}
