use petgraph::Graph;
use petgraph::Undirected;
use petgraph::algo::min_spanning_tree;
use petgraph::data::Element;
use petgraph::graph::NodeIndex;

use procedual_art::graph::min_spanning_tree_from_vertices;
use procedual_art::graph::min_spanning_tree_from_vertices_edge_list;
use wasm_bindgen::prelude::*;

use crate::WASMWrapper;
use crate::geometry::WASMVectorVec;
use crate::procedual_art::graph::types::WASMUnitFloat64Graph;
use crate::procedual_art::graph::types::WASMUsizeUsizeGraph;
use crate::procedual_art::graph::types::WASMVectorUnitGraph;

#[wasm_bindgen]
pub fn wasm_graph_minimum_spanning_tree(graph: &WASMUnitFloat64Graph) -> WASMUsizeUsizeGraph {
    let graph = graph.inner();
    let mst = min_spanning_tree(graph);

    let mut out: Graph<usize, usize, Undirected> =
        Graph::with_capacity(graph.node_count(), mst.size_hint().0);

    mst.enumerate().for_each(|(i, e)| match e {
        Element::Node { weight: _ } => {
            out.add_node(i);
        }
        Element::Edge {
            source,
            target,
            weight: _,
        } => {
            // Note we index two different graphs with these node indices
            // but that shouldn't be a problem
            let start = NodeIndex::new(source);
            let end = NodeIndex::new(target);

            out.add_edge(start, end, graph.find_edge(start, end).unwrap().index());
        }
    });

    WASMUsizeUsizeGraph::promote(out)
}

#[wasm_bindgen]
pub fn wasm_graph_minimum_spanning_tree_edge_list(graph: &WASMUnitFloat64Graph) -> Vec<usize> {
    let graph = graph.inner();
    let mst = min_spanning_tree(graph);

    let mut out: Vec<usize> = Vec::with_capacity(mst.size_hint().0);

    for e in mst.skip(graph.node_count()) {
        if let Element::Edge {
            source,
            target,
            weight: _,
        } = e
        {
            let start = NodeIndex::new(source);
            let end = NodeIndex::new(target);

            out.push(graph.find_edge(start, end).unwrap().index());
        } else {
            unreachable!()
        }
    }

    out
}

#[wasm_bindgen]
pub fn wasm_graph_minimum_spanning_tree_of_vertices(
    vertex_data: &WASMVectorVec,
) -> WASMVectorUnitGraph {
    let verticies = vertex_data.inner();
    WASMVectorUnitGraph::promote(min_spanning_tree_from_vertices(verticies))
}

#[wasm_bindgen]
pub fn wasm_graph_minimum_spanning_tree_of_vertices_edge_list(
    vertex_data: &WASMVectorVec,
) -> Vec<usize> {
    let verticies = vertex_data.inner();
    min_spanning_tree_from_vertices_edge_list(verticies)
        .into_iter()
        .flatten()
        .collect()
}
