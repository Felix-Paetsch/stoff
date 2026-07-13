use petgraph::{Graph, Undirected};
use wasm_bindgen::prelude::*;
use wasm_wrapper_derive::WASMWrapper;

#[wasm_bindgen]
#[derive(WASMWrapper)]
pub struct WASMUnitFloat64Graph(Graph<(), f64, Undirected>);
