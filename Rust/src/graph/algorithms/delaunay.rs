use petgraph::{Graph, Undirected};
use spade::{DelaunayTriangulation, HasPosition, Point2, Triangulation};

use crate::geometry::Vector;

#[derive(Clone, Copy, Debug)]
struct SpadeVector {
    index: usize,
    vertex: Vector,
}

impl HasPosition for SpadeVector {
    type Scalar = f64;

    fn position(&self) -> Point2<f64> {
        Point2::new(self.vertex.x(), self.vertex.y())
    }
}

pub fn delaunay_triangulation(vertices: &[Vector]) -> Graph<Vector, (), Undirected> {
    let mut graph = Graph::<Vector, (), Undirected>::new_undirected();

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
        .map(|(index, vertex)| SpadeVector { index, vertex })
        .collect();

    let triangulation = match DelaunayTriangulation::<SpadeVector>::bulk_load_stable(spade_vertices)
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
