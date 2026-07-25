use geometry::Shape;
use procedual_art::pathing::{double_run_shape_graph, double_run_vertex_graph};
use wasm_bindgen::prelude::*;

use crate::{
    WASMWrapper,
    geometry::WASMShapeCollection,
    procedual_art::graph::{WASMVectorShapeGraph, WASMVectorUnitGraph},
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
