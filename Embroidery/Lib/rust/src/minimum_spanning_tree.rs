use petgraph::graph::{Graph, NodeIndex};
use std::cmp::Ordering;
use std::collections::BinaryHeap;

use petgraph::graph::UnGraph;
use petgraph::prelude::EdgeIndex;
use petgraph::unionfind::UnionFind;
use petgraph::visit::NodeIndexable;
use petgraph::Undirected;

use petgraph::visit::EdgeRef;
use wasm_bindgen::prelude::*;

use crate::compatibility_layer::{
    undirected_graph_to_vecf64, vecf64_to_undirected_graph, vecf64_to_vertex_vec,
};
use crate::vertex::Vertex;

struct GraphEdge {
    pub reference: usize,
    pub weight: f64,
}

impl PartialEq for GraphEdge {
    #[inline]
    fn eq(&self, other: &GraphEdge) -> bool {
        self.cmp(other) == Ordering::Equal
    }
}

impl Eq for GraphEdge {}

impl PartialOrd for GraphEdge {
    #[inline]
    fn partial_cmp(&self, other: &GraphEdge) -> Option<Ordering> {
        Some(self.cmp(other))
    }
}

impl Ord for GraphEdge {
    #[inline]
    fn cmp(&self, other: &GraphEdge) -> Ordering {
        let a = &self.weight;
        let b = &other.weight;
        if a == b {
            Ordering::Equal
        } else if a < b {
            Ordering::Greater
        } else if a > b {
            Ordering::Less
        } else if a.ne(a) && b.ne(b) {
            Ordering::Equal
        } else if a.ne(a) {
            Ordering::Less
        } else {
            Ordering::Greater
        }
    }
}

#[wasm_bindgen]
pub fn minimum_spanning_tree_on_graph(graph_data: &[f64]) -> Option<Vec<f64>> {
    // KruskalsAlgorithm

    let g = vecf64_to_undirected_graph(graph_data)?;

    // 1. Create disconnection sets for vertices
    let mut subgraphs: UnionFind<usize> = UnionFind::new(g.node_bound());

    // 2. Order vertices by weight
    let edges = g.edge_references();
    let mut sort_edges = BinaryHeap::with_capacity(edges.size_hint().0);
    for edge in edges {
        let src = g.node_weight(edge.source())?;
        let trg = g.node_weight(edge.target())?;

        // Create a min heap with the edges and edge weights
        sort_edges.push(GraphEdge {
            reference: edge.id().index(),
            weight: src.distance(*trg),
        });
    }

    // 3. Create result graph without edges
    let mut mst: Graph<Vertex, (), Undirected> =
        UnGraph::with_capacity(g.node_count(), g.node_count() - 1);
    for ix in 0..g.node_count() {
        let weight = g.node_weight(NodeIndex::new(ix))?;
        mst.add_node(*weight);
    }

    let node_count = g.node_count();
    let mut current_edges = 0;

    // 4. Kruskal loop
    while let Some(ge) = sort_edges.pop() {
        let edge_index = ge.reference;
        let (src, target) = g.edge_endpoints(EdgeIndex::new(edge_index))?;

        if subgraphs.union(src.index(), target.index()) {
            mst.add_edge(src, target, ());
            current_edges += 1;
            if current_edges == node_count - 1 {
                break;
            }
        }
    }

    Some(undirected_graph_to_vecf64(&mst))
}

#[wasm_bindgen]
pub fn minimum_spanning_tree_on_vertices(graph_data: &[f64]) -> Option<Vec<f64>> {
    // KruskalsAlgorithm

    let g = vecf64_to_vertex_vec(graph_data)?;
    let vertex_count = g.len();

    // 1. Create disconnection sets for vertices
    let mut subgraphs: UnionFind<usize> = UnionFind::new(vertex_count);

    // 2. Order vertices by weight
    let mut sort_edges = BinaryHeap::with_capacity(compute_edge_index(
        vertex_count - 2,
        vertex_count - 1,
        vertex_count,
    ));

    for i in 0..vertex_count - 1 {
        for j in i + 1..vertex_count {
            let src = g[i];
            let trg = g[j];

            sort_edges.push(GraphEdge {
                reference: compute_edge_index(i, j, vertex_count),
                weight: src.distance(trg),
            });
        }
    }

    // 3. Create result graph without edges
    let mut mst: Graph<Vertex, (), Undirected> =
        UnGraph::with_capacity(vertex_count, vertex_count - 1);

    for node in g.iter() {
        mst.add_node(*node);
    }

    let mut current_edges = 0;

    // 4. Kruskal loop
    while let Some(ge) = sort_edges.pop() {
        let edge_index = ge.reference;
        let (src, target) = compute_node_indices(edge_index, vertex_count);

        if subgraphs.union(src, target) {
            mst.add_edge(NodeIndex::new(src), NodeIndex::new(target), ());
            current_edges += 1;
            if current_edges == vertex_count - 1 {
                break;
            }
        }
    }

    Some(undirected_graph_to_vecf64(&mst))
}

fn compute_edge_index(v1_index: usize, v2_index: usize, vertex_count: usize) -> usize {
    if v1_index > v2_index {
        return compute_edge_index(v2_index, v1_index, vertex_count);
    }

    let prev_edges: usize = v1_index * vertex_count - (v1_index * (v1_index + 1) / 2);
    prev_edges + v2_index - v1_index - 1
}

fn compute_node_indices(edge_index: usize, vertex_count: usize) -> (usize, usize) {
    let n = vertex_count as f64;
    let e = edge_index as f64;

    let v1 =
        (((2.0 * n - 1.0) - ((2.0 * n - 1.0).powi(2) - 8.0 * e).sqrt()) / 2.0).floor() as usize;

    let prev_edges = v1 * vertex_count - (v1 * (v1 + 1) / 2);
    let v2 = v1 + 1 + (edge_index - prev_edges);

    (v1, v2)
}
