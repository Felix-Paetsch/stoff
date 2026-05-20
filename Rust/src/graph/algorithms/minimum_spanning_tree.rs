use petgraph::algo::min_spanning_tree;
use petgraph::data::FromElements;
use petgraph::visit::NodeRef;
use petgraph::{Graph, Undirected};
use wasm_bindgen::prelude::*;

use crate::geometry::wasm_compatability::vecf64_to_vertex_vec;
use crate::geometry::Vector;
use crate::graph::algorithms::delaunay::delaunay_triangulation;
use crate::graph::wasm_compatibility::{WASMEdge, WASMNode, WASMTransmittableGraph};

use petgraph::graph::EdgeIndex;

pub fn minimum_spanning_tree_from_vertices(v: &[Vector]) -> Graph<Vector, (), Undirected> {
    let delaunay = delaunay_triangulation(v);

    let mut edge_weights = vec![0.0; delaunay.edge_count()];

    for edge_idx in delaunay.edge_indices() {
        let (a, b) = delaunay.edge_endpoints(edge_idx).unwrap();
        let va = delaunay[a];
        let vb = delaunay[b];
        edge_weights[edge_idx.index()] = va.distance(vb);
    }

    let weighted: Graph<Vector, f64, Undirected> = delaunay.map_owned(
        |_, node| node,
        |edge_idx: EdgeIndex, _| edge_weights[edge_idx.index()],
    );

    let mst_weighted: Graph<Vector, f64, Undirected> =
        Graph::from_elements(min_spanning_tree(&weighted));

    mst_weighted.map_owned(|_, node| node, |_, _| ())
}

#[wasm_bindgen]
pub fn wasm_graph_minimum_spanning_tree(graph_data: &[f64]) -> Vec<u32> {
    let tgraph = WASMTransmittableGraph::deserialize(graph_data);
    let pgraph: Graph<WASMNode, WASMEdge<f64>, Undirected> = tgraph.into();

    let mst = min_spanning_tree(&pgraph);
    let mst_graph: Graph<WASMNode, WASMEdge<f64>, Undirected> = Graph::from_elements(mst);
    let (_, edges) = mst_graph.into_nodes_edges();

    let ret_edges: Vec<WASMEdge<f64>> = edges.into_iter().map(|e| e.weight).collect();
    WASMTransmittableGraph::serialize_edge_subset(&ret_edges)
}

#[wasm_bindgen]
pub fn wasm_graph_minimum_spanning_tree_of_vertices(vertex_data: &[f64]) -> Vec<u32> {
    let verticies = vecf64_to_vertex_vec(vertex_data);
    let mst = minimum_spanning_tree_from_vertices(&verticies);

    let (_, edges) = mst.into_nodes_edges();

    edges
        .into_iter()
        .flat_map(|e| {
            [
                e.source().index().id() as u32,
                e.target().index().id() as u32,
            ]
        })
        .collect()
}
