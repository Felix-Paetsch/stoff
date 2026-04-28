use petgraph::graph::{Graph, NodeIndex};

use petgraph::unionfind::UnionFind;

use petgraph::visit::EdgeRef;
use std::collections::HashMap;
use wasm_bindgen::prelude::*;

use crate::compatibility_layer::{undirected_graph_to_vecf64, vecf64_to_undirected_graph};

#[wasm_bindgen]
pub fn identify_equal_nodes(graph_data: &[f64], tolerance: f64) -> Option<Vec<f64>> {
    // It finds the transitive closures of equality up to tolerance and builds a new graph out of
    // them. In particular keeping all reasonable order assumptions in place
    // Note that we currently dont take the average of the equivalence classes but only the first
    // rep.

    let g = vecf64_to_undirected_graph(graph_data)?;
    let pre_node_count = g.node_count();

    let mut identified_verticies: UnionFind<usize> = UnionFind::new(pre_node_count);

    let raw_nodes = g.raw_nodes();
    for i in 0..raw_nodes.len() - 1 {
        for j in i + 1..raw_nodes.len() {
            let v1 = raw_nodes[i].weight;
            let v2 = raw_nodes[j].weight;
            if v1.distance(v2) <= tolerance {
                identified_verticies.union(i, j);
            }
        }
    }

    let labeling = identified_verticies.into_labeling();
    // The representative gets mapped to the node index
    let mut vertex_map: HashMap<usize, usize> = HashMap::new();

    let mut out = Graph::with_capacity(pre_node_count, g.edge_count());
    for i in 0..pre_node_count {
        let existing_vertex = vertex_map.get(&labeling[i]);
        if existing_vertex.is_none() {
            vertex_map.insert(labeling[i], out.node_count());
            out.add_node(raw_nodes[i].weight);
        }
    }

    for edge in g.edge_references() {
        let src = labeling[edge.source().index()];
        let trg = labeling[edge.target().index()];
        out.add_edge(
            NodeIndex::new(*vertex_map.get(&src).unwrap()),
            NodeIndex::new(*vertex_map.get(&trg).unwrap()),
            (),
        );
    }

    Some(undirected_graph_to_vecf64(&out))
}
