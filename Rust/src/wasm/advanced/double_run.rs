use wasm_bindgen::prelude::*;

use crate::{
    advanced::double_run_graph::{double_run_shape_graph, double_run_vertex_graph},
    geometry::Shape,
    wasm::{
        WASMWrapper,
        geometry::types::WASMShapeCollection,
        graph::types::{
            wasm_vector_shape_graph::WASMVectorShapeGraph,
            wasm_vector_unit_graph::WASMVectorUnitGraph,
        },
    },
};

#[wasm_bindgen]
pub fn wasm_advanced_double_run_vertex_graph(graph: &WASMVectorUnitGraph) -> WASMShapeCollection {
    let gons = double_run_vertex_graph(graph.inner());
    WASMShapeCollection::promote(gons.into_iter().map(Shape::Polygon).collect())
}

#[wasm_bindgen]
pub fn wasm_advanced_double_run_shape_graph(graph: &WASMVectorShapeGraph) -> WASMShapeCollection {
    let gons = double_run_shape_graph(graph.inner());
    WASMShapeCollection::promote(gons.into_iter().map(Shape::Polygon).collect())
}
