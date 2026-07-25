use minimum_weight_perfect_matching::{max_weight_matching_f64, min_weight_matching_f64};
use petgraph::{Graph, Undirected};

pub fn max_weight_perfect_matching<T>(g: &Graph<T, f64, Undirected>) -> Vec<(usize, usize)> {
    max_weight_matching_f64(g)
}

pub fn min_weight_perfect_matching<T>(g: &Graph<T, f64, Undirected>) -> Vec<(usize, usize)> {
    min_weight_matching_f64(g)
}
