use wasm_bindgen::prelude::*;

use crate::{
    graph::algorithms::minimum_weight_perfect_matching::{
        max_weight_matching_f64, min_weight_matching_f64,
    },
    wasm::{WASMWrapper, graph::types::wasm_unit_f64_graph::WASMUnitFloat64Graph},
};

#[wasm_bindgen]
pub fn wasm_graph_min_weight_matching(graph: &WASMUnitFloat64Graph) -> Vec<usize> {
    min_weight_matching_f64(graph.inner())
        .into_iter()
        .flat_map(|a| [a.0, a.1])
        .collect()
}

#[wasm_bindgen]
pub fn wasm_graph_max_weight_matching(graph: &WASMUnitFloat64Graph) -> Vec<usize> {
    max_weight_matching_f64(graph.inner())
        .into_iter()
        .flat_map(|a| [a.0, a.1])
        .collect()
}
