use procedual_art::graph::{max_weight_perfect_matching, min_weight_perfect_matching};
use wasm_bindgen::prelude::*;

use crate::{WASMWrapper, procedual_art::graph::types::WASMUnitFloat64Graph};

#[wasm_bindgen]
pub fn wasm_graph_min_weight_perfect_matching(graph: &WASMUnitFloat64Graph) -> Vec<usize> {
    min_weight_perfect_matching(graph.inner())
        .into_iter()
        .flat_map(|a| [a.0, a.1])
        .collect()
}

#[wasm_bindgen]
pub fn wasm_graph_max_weight_perfect_matching(graph: &WASMUnitFloat64Graph) -> Vec<usize> {
    max_weight_perfect_matching(graph.inner())
        .into_iter()
        .flat_map(|a| [a.0, a.1])
        .collect()
}
