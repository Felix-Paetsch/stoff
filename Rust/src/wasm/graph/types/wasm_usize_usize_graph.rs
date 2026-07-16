use petgraph::{Graph, Undirected};
use wasm_bindgen::prelude::*;
use wasm_wrapper_derive::WASMWrapper;

#[wasm_bindgen]
#[derive(WASMWrapper)]
pub struct WASMUsizeUsizeGraph(Graph<usize, usize, Undirected>);

#[wasm_bindgen]
impl WASMUsizeUsizeGraph {
    pub fn node_count(&self) -> usize {
        self.0.node_count()
    }

    pub fn nodes(&self) -> Vec<usize> {
        self.0.node_weights().copied().collect()
    }

    pub fn edge_endpoint_indices(&self) -> Vec<usize> {
        let node_count = self.0.node_count();
        self.0
            .raw_edges()
            .iter()
            .map(|e| {
                let start = e.source().index();
                let end = e.target().index();
                start * node_count + end
            })
            .collect()
    }

    pub fn edges(&self) -> Vec<usize> {
        self.0.raw_edges().iter().map(|e| e.weight).collect()
    }
}
