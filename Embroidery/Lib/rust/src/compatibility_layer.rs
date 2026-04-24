use petgraph::graph::{Graph, NodeIndex};
use petgraph::visit::EdgeRef;
use petgraph::Undirected;

use crate::vertex::Vertex;

// A graph is encoded as follows:
// [#num vertices, v1x, v1y, v2x, v2y, ..., edge1Start, edge1End, edge2Start, ...]
pub fn vecf64_to_undirected_graph(coords: &[f64]) -> Option<Graph<Vertex, (), Undirected>> {
    if coords.is_empty() {
        return None;
    }

    let num_vertices_f = coords[0];

    if !num_vertices_f.is_finite() || num_vertices_f < 0.0 {
        return None;
    }

    let num_vertices = num_vertices_f as usize;

    if num_vertices_f != num_vertices as f64 {
        return None;
    }

    let vertex_data_len = 1 + num_vertices.checked_mul(2)?;

    if coords.len() < vertex_data_len {
        return None;
    }

    let mut graph = Graph::<Vertex, (), Undirected>::new_undirected();
    let mut nodes = Vec::<NodeIndex>::with_capacity(num_vertices);

    for i in 0..num_vertices {
        let x = coords[1 + 2 * i];
        let y = coords[1 + 2 * i + 1];

        if !x.is_finite() || !y.is_finite() {
            return None;
        }

        let node = graph.add_node(Vertex { x, y });
        nodes.push(node);
    }

    let edge_start = vertex_data_len;

    for i in (edge_start..coords.len()).step_by(2) {
        let a_f = coords[i];
        let b_f = coords[i + 1];

        if !a_f.is_finite() || !b_f.is_finite() || a_f < 0.0 || b_f < 0.0 {
            return None;
        }

        let a = a_f as usize;
        let b = b_f as usize;

        if a_f != a as f64 || b_f != b as f64 {
            return None;
        }

        if a >= num_vertices || b >= num_vertices {
            return None;
        }

        graph.add_edge(nodes[a], nodes[b], ());
    }

    Some(graph)
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

// vertices given as (x,y) array
pub fn vecf64_to_vertex_vec(vec: &[f64]) -> Option<Vec<Vertex>> {
    if !vec.len().is_multiple_of(2) {
        return None;
    }

    let mut out = Vec::with_capacity(vec.len() / 2);

    for i in (0..vec.len()).step_by(2) {
        let x = vec[i];
        let y = vec[i + 1];

        if !x.is_finite() || !y.is_finite() {
            return None;
        }

        out.push(Vertex { x, y });
    }

    Some(out)
}

pub fn vertex_vec_to_vecf64(vertices: &[Vertex]) -> Vec<f64> {
    let mut out = Vec::with_capacity(vertices.len() * 2);

    for v in vertices {
        out.push(v.x);
        out.push(v.y);
    }

    out
}
