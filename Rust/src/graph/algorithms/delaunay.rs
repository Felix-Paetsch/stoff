use petgraph::{Graph, Undirected};
use spade::{DelaunayTriangulation, HasPosition, Point2, Triangulation};
use wasm_bindgen::prelude::*;

use crate::geometry::{geometry_compatability_layer::vecf64_to_vertex_vec, vertex::Vertex};

#[derive(Clone, Copy, Debug)]
struct SpadeVertex {
    index: usize,
    vertex: Vertex,
}

impl HasPosition for SpadeVertex {
    type Scalar = f64;

    fn position(&self) -> Point2<f64> {
        Point2::new(self.vertex.x, self.vertex.y)
    }
}

pub fn delaunay_triangulation(vertices: &[Vertex]) -> Graph<Vertex, (), Undirected> {
    let mut graph = Graph::<Vertex, (), Undirected>::new_undirected();

    if vertices.is_empty() {
        return graph;
    }

    // Add all original vertices to the petgraph graph first, preserving order.
    let node_indices: Vec<_> = vertices
        .iter()
        .copied()
        .map(|v| graph.add_node(v))
        .collect();

    let spade_vertices: Vec<_> = vertices
        .iter()
        .copied()
        .enumerate()
        .map(|(index, vertex)| SpadeVertex { index, vertex })
        .collect();

    let triangulation = match DelaunayTriangulation::<SpadeVertex>::bulk_load_stable(spade_vertices)
    {
        Ok(t) => t,
        Err(_) => return graph,
    };

    for edge in triangulation.undirected_edges() {
        let [from, to] = edge.vertices();
        let i = from.data().index;
        let j = to.data().index;

        if i != j {
            graph.update_edge(node_indices[i], node_indices[j], ());
        }
    }

    graph
}

#[wasm_bindgen]
pub fn wasm_graph_delaunay(vertex_data: &[f64]) -> Vec<u32> {
    let vertices = vecf64_to_vertex_vec(vertex_data).unwrap();
    let delaunay = delaunay_triangulation(&vertices);
    let (_, edges) = delaunay.into_nodes_edges();

    edges
        .into_iter()
        .flat_map(|e| [e.source().index() as u32, e.target().index() as u32])
        .collect()
}
