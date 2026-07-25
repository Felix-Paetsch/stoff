use geometry::{Shape, ShapeT, Vector};
use petgraph::{Graph, Undirected};
use wasm_bindgen::prelude::*;
use wasm_wrapper_derive::WASMWrapper;

use crate::{WASMWrapper, procedual_art::graph::types::WASMUnitFloat64Graph};

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
