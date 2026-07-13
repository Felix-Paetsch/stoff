use petgraph::{Graph, Undirected};
use wasm_bindgen::prelude::*;
use wasm_wrapper_derive::WASMWrapper;

#[wasm_bindgen]
#[derive(WASMWrapper)]
pub struct WASMUsizeUsizeGraph(Graph<usize, usize, Undirected>);
