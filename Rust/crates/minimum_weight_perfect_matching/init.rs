use petgraph::{Graph, Undirected};

use crate::graph::algorithms::minimum_weight_perfect_matching::compute::max_weight_matching;

fn discretize(value: f64) -> i128 {
    (value * 1_000_000.0).round() as i128
}

#[allow(unused)]
pub fn max_weight_matching_f64<T>(g: &Graph<T, f64, Undirected>) -> Vec<(usize, usize)> {
    todo!("Reduce edges to have at most one. Then reconstruct");

    let new_g = g.map(|_, __| (), |_, e| discretize(*e));
    max_weight_matching(&new_g, true).into_iter().collect()
}

pub fn min_weight_matching_f64<T>(g: &Graph<T, f64, Undirected>) -> Vec<(usize, usize)> {
    let new_g = g.map(|_, __| (), |_, e| -discretize(*e));
    max_weight_matching(&new_g, true).into_iter().collect()
}
