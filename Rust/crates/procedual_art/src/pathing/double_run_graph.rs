use petgraph::{
    Graph, Undirected,
    graph::{EdgeIndex, NodeIndex},
    visit::EdgeRef,
};

use crate::graph::iter_connected_components;
use geometry::{Polygon, Shape, ShapeT, Vector};

pub fn double_run_vertex_graph(g: &Graph<Vector, (), Undirected>) -> Vec<Polygon> {
    iter_connected_components(g)
        .map(|component| {
            debug_assert!(component.node_count() > 0);
            if component.node_count() == 1 {
                return Polygon::new(vec![**component.node_weights().next().unwrap()]);
            }

            let edge_count = component.edge_count();
            let mut visited_edges = vec![false; edge_count];
            let mut vertices = Vec::with_capacity(edge_count.saturating_mul(2) - 1);

            let start_edge = EdgeIndex::new(0);
            let start = component.edge_endpoints(start_edge).unwrap().0;

            // Stack entries are `(edge, from)`, where `from` is the vertex from
            // which this traversal of the undirected edge starts.
            let mut stack: Vec<(EdgeIndex, NodeIndex)> = vec![(start_edge, start)];

            while let Some((edge_id, from)) = stack.pop() {
                let (a, b) = component
                    .edge_endpoints(edge_id)
                    .expect("edge from component must exist");

                let to = if a == from { b } else { a };

                if !visited_edges[edge_id.index()] {
                    visited_edges[edge_id.index()] = true;
                    vertices.push(*component[from]);

                    stack.push((edge_id, to));

                    for next_edge in component.edges(to) {
                        if !visited_edges[next_edge.id().index()] {
                            stack.push((next_edge.id(), to));
                        }
                    }
                } else {
                    vertices.push(*component[from]);
                }
            }

            debug_assert_eq!(vertices.len(), edge_count.saturating_mul(2) - 1);
            Polygon::new(vertices)
        })
        .collect()
}

pub fn double_run_shape_graph(g: &Graph<Vector, Shape, Undirected>) -> Vec<Polygon> {
    iter_connected_components(g)
        .map(|component| {
            debug_assert!(component.node_count() > 0);
            debug_assert!(g.edge_weights().all(|e| !e.is_empty()));

            if component.node_count() == 1 {
                return Polygon::new(vec![**component.node_weights().next().unwrap()]);
            }

            let edge_count = component.edge_count();
            let mut visited_edges = vec![false; edge_count];

            let total_vertices = 2 * edge_count - 1
                + g.edge_weights()
                    .map(|w| w.looping_vertex_count() - 2)
                    .sum::<usize>();
            let mut vertices = Vec::with_capacity(total_vertices);

            let start_edge = EdgeIndex::new(0);
            let start = component.edge_endpoints(start_edge).unwrap().0;

            // Stack entries are `(edge, from)`, where `from` is the vertex from
            // which this traversal of the undirected edge starts.
            let mut stack: Vec<(EdgeIndex, NodeIndex)> = vec![(start_edge, start)];

            while let Some((edge_id, from)) = stack.pop() {
                let (a, b) = component
                    .edge_endpoints(edge_id)
                    .expect("edge from component must exist");

                let to = if a == from { b } else { a };

                if !visited_edges[edge_id.index()] {
                    let current_vertex = *component[from];
                    visited_edges[edge_id.index()] = true;
                    vertices.push(current_vertex);

                    let shape = *component.edge_weight(edge_id).unwrap();
                    let first = shape.vertex_at(0);
                    let last = shape.vertex_at(shape.looping_vertex_count() - 1);

                    if first.distance_squared(current_vertex)
                        <= last.distance_squared(current_vertex)
                    {
                        vertices
                            .extend(shape.vertices_from_to(1, shape.looping_vertex_count() - 1));
                    } else {
                        vertices.extend(
                            shape.vertices_rev_from_to(1, shape.looping_vertex_count() - 1),
                        );
                    }

                    stack.push((edge_id, to));

                    for next_edge in component.edges(to) {
                        if !visited_edges[next_edge.id().index()] {
                            stack.push((next_edge.id(), to));
                        }
                    }
                } else {
                    vertices.push(*component[from]);
                }
            }

            debug_assert_eq!(vertices.len(), total_vertices);
            Polygon::new(vertices)
        })
        .collect()
}
