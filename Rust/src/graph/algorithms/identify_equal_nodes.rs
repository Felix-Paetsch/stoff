use std::collections::HashMap;

use petgraph::unionfind::UnionFind;
use wasm_bindgen::prelude::*;

use crate::graph::graph::Graph;

impl Graph {
    pub fn identify_equal_nodes(&self, tolerance: f64) -> Graph {
        let node_count = self.node_count();

        if node_count == 0 {
            return Graph::empty();
        }

        let mut groups: UnionFind<usize> = UnionFind::new(node_count);

        for i in 0..node_count {
            for j in (i + 1)..node_count {
                let v1 = self.nodes[i].vec;
                let v2 = self.nodes[j].vec;

                if v1.distance(v2) <= tolerance {
                    groups.union(i, j);
                }
            }
        }

        let labels = groups.into_labeling();
        let mut old_to_new = HashMap::new();
        let mut out = Graph::with_capacity(node_count, self.edge_count());

        for (i, &label) in labels.iter().enumerate() {
            old_to_new.entry(label).or_insert_with(|| {
                let new_index = out.node_count();
                out.add_node(self.nodes[i].vec);
                new_index
            });
        }

        for edge in &self.edges {
            let a = labels[edge.end_indices[0]];
            let b = labels[edge.end_indices[1]];

            let new_a = old_to_new[&a];
            let new_b = old_to_new[&b];

            out.add_edge(new_a, new_b);
        }

        out
    }
}

#[wasm_bindgen]
pub fn wasm_graph_identify_equal_nodes(graph_data: &[f64], tolerance: f64) -> Option<Vec<f64>> {
    let graph = Graph::try_from(graph_data).ok()?;
    Some(graph.identify_equal_nodes(tolerance).serialize())
}
