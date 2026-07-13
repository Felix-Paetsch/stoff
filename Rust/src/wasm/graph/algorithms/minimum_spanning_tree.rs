use petgraph::Graph;
use petgraph::Undirected;
use petgraph::algo::min_spanning_tree;
use petgraph::data::Element;
use petgraph::graph::NodeIndex;

use wasm_bindgen::prelude::*;

use crate::graph::algorithms::minimum_spanning_tree::minimum_spanning_tree_from_vertices;
use crate::graph::algorithms::minimum_spanning_tree::minimum_spanning_tree_from_vertices_edge_list;
use crate::wasm::WASMWrapper;
use crate::wasm::geometry::types::WASMVectorVec;
use crate::wasm::graph::types::wasm_unit_f64_graph::WASMUnitFloat64Graph;
use crate::wasm::graph::types::wasm_usize_usize_graph::WASMUsizeUsizeGraph;
use crate::wasm::graph::types::wasm_vector_unit_graph::WASMVectorUnitGraph;

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
pub fn wasm_graph_minimum_spanning_tree_of_vertices(
    vertex_data: &WASMVectorVec,
) -> WASMVectorUnitGraph {
    let verticies = vertex_data.inner();
    WASMVectorUnitGraph::promote(minimum_spanning_tree_from_vertices(verticies))
}

#[wasm_bindgen]
pub fn wasm_graph_minimum_spanning_tree_of_vertices_edge_list(
    vertex_data: &WASMVectorVec,
) -> Vec<usize> {
    let verticies = vertex_data.inner();
    minimum_spanning_tree_from_vertices_edge_list(verticies)
        .into_iter()
        .flatten()
        .collect()
}
