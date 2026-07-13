use wasm_bindgen::prelude::*;

use crate::{
    graph::algorithms::delaunay::delaunay_triangulation,
    wasm::{
        WASMWrapper, geometry::types::WASMVectorVec,
        graph::types::wasm_vector_unit_graph::WASMVectorUnitGraph,
    },
};

#[wasm_bindgen]
pub fn wasm_graph_delaunay_edge(vertex_data: &WASMVectorVec) -> WASMVectorUnitGraph {
    let vertices = vertex_data.inner();
    let delaunay = delaunay_triangulation(vertices);
    WASMVectorUnitGraph::promote(delaunay)
}

#[wasm_bindgen]
pub fn wasm_graph_delaunay_edge_list(vertex_data: &WASMVectorVec) -> Vec<usize> {
    let vertices = vertex_data.inner();
    let delaunay = delaunay_triangulation(vertices);
    let (_, edges) = delaunay.into_nodes_edges();

    edges
        .into_iter()
        .flat_map(|e| [e.source().index(), e.target().index()])
        .collect()
}
