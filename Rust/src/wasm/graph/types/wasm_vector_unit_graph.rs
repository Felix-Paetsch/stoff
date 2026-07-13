use petgraph::{Graph, Undirected};
use wasm_bindgen::prelude::*;
use wasm_wrapper_derive::WASMWrapper;

use crate::{
    geometry::Vector,
    wasm::{WASMWrapper, graph::types::wasm_unit_f64_graph::WASMUnitFloat64Graph},
};

#[wasm_bindgen]
#[derive(WASMWrapper)]
pub struct WASMVectorUnitGraph(Graph<Vector, (), Undirected>);

#[wasm_bindgen]
impl WASMVectorUnitGraph {
    pub fn as_unit_float64_graph(&self) -> WASMUnitFloat64Graph {
        let g = &self.0;
        let out: Graph<(), f64, Undirected> = g.map(
            |_, _| (),
            |idx, _| {
                let ep = g.edge_endpoints(idx).unwrap();
                let start_vec = g.node_weight(ep.0).unwrap();
                let end_vec = g.node_weight(ep.1).unwrap();
                start_vec.distance(*end_vec)
            },
        );
        WASMUnitFloat64Graph::promote(out)
    }
}
