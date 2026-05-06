use std::cmp::Ordering;
use std::collections::BinaryHeap;

use petgraph::unionfind::UnionFind;
use wasm_bindgen::prelude::*;

use crate::geometry::geometry_compatability_layer::vecf64_to_vertex_vec;
use crate::geometry::vertex::Vertex;
use crate::graph::graph::Graph;

#[derive(Debug, Clone, Copy)]
struct WeightedEdge {
    src: usize,
    dst: usize,
    weight: f64,
}

impl PartialEq for WeightedEdge {
    fn eq(&self, other: &Self) -> bool {
        self.src == other.src
            && self.dst == other.dst
            && self.weight.total_cmp(&other.weight) == Ordering::Equal
    }
}

impl Eq for WeightedEdge {}

impl PartialOrd for WeightedEdge {
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
        Some(self.cmp(other))
    }
}

impl Ord for WeightedEdge {
    fn cmp(&self, other: &Self) -> Ordering {
        other.weight.total_cmp(&self.weight)
    }
}

fn kruskal_mst(vertices: &[Vertex], edges: BinaryHeap<WeightedEdge>) -> Graph {
    let node_count = vertices.len();

    if node_count == 0 {
        return Graph::empty();
    }

    let mut mst = Graph::with_capacity(node_count, node_count.saturating_sub(1));
    for &vertex in vertices {
        mst.add_node(vertex);
    }

    let mut subgraphs: UnionFind<usize> = UnionFind::new(node_count);
    let mut edge_count = 0;
    let mut edges = edges;

    while let Some(edge) = edges.pop() {
        if subgraphs.union(edge.src, edge.dst) {
            mst.add_edge(edge.src, edge.dst);
            edge_count += 1;

            if edge_count == node_count.saturating_sub(1) {
                break;
            }
        }
    }

    mst
}

impl Graph {
    pub fn minimum_spanning_tree(&self) -> Self {
        if self.node_count() == 0 {
            return Graph::empty();
        }

        let mut edges = BinaryHeap::with_capacity(self.edge_count());

        for edge in &self.edges {
            let [src, dst] = self.edge_endpoints(edge).unwrap();

            edges.push(WeightedEdge {
                src: src.index,
                dst: dst.index,
                weight: src.vec.distance(dst.vec),
            });
        }

        let vertices: Vec<Vertex> = self.vertices().copied().collect();
        kruskal_mst(&vertices, edges)
    }
}

pub fn minimum_spanning_tree_on_vertices(vertices: &[Vertex]) -> Graph {
    let node_count = vertices.len();

    if node_count == 0 {
        return Graph::empty();
    }

    let edge_capacity = node_count.saturating_mul(node_count.saturating_sub(1)) / 2;
    let mut edges = BinaryHeap::with_capacity(edge_capacity);

    for src in 0..node_count {
        for dst in src + 1..node_count {
            edges.push(WeightedEdge {
                src,
                dst,
                weight: vertices[src].distance(vertices[dst]),
            });
        }
    }

    kruskal_mst(vertices, edges)
}

#[wasm_bindgen]
pub fn wasm_graph_minimum_spanning_tree(graph_data: &[f64]) -> Option<Vec<f64>> {
    let graph = Graph::try_from(graph_data).ok()?;
    Some(graph.minimum_spanning_tree().serialize())
}

#[wasm_bindgen]
pub fn wasm_graph_minimum_spanning_tree_on_vertices(vertex_data: &[f64]) -> Option<Vec<f64>> {
    let vertices = vecf64_to_vertex_vec(vertex_data)?;
    Some(minimum_spanning_tree_on_vertices(&vertices).serialize())
}
