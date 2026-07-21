use petgraph::{Graph, Undirected};
use wasm_bindgen::prelude::*;
use wasm_wrapper_derive::WASMWrapper;

use crate::{
    geometry::{Shape, ShapeT, Vector},
    wasm::{WASMWrapper, graph::types::wasm_unit_f64_graph::WASMUnitFloat64Graph},
};

#[wasm_bindgen]
#[derive(WASMWrapper)]
pub struct WASMVectorShapeGraph(Graph<Vector, Shape, Undirected>);

#[wasm_bindgen]
impl WASMVectorShapeGraph {
    pub fn as_unit_float64_graph(&self) -> WASMUnitFloat64Graph {
        let out: Graph<(), f64, Undirected> = self.0.map(|_, _| (), |_, e| e.length());
        WASMUnitFloat64Graph::promote(out)
    }
}
