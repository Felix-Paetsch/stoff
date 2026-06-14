use petgraph::{Graph, Undirected};

use crate::geometry::Vector;

pub fn distance_graph(verts: &[Vector]) -> Graph<(), f64, Undirected> {
    let n = verts.len();
    let mut graph = Graph::<(), f64, Undirected>::with_capacity(n, (n * (n - 1)) / 2);

    let nodes: Vec<_> = (0..n).map(|_| graph.add_node(())).collect();
    for i in 0..n {
        for j in (i + 1)..n {
            let distance = verts[i].distance(verts[j]);
            graph.add_edge(nodes[i], nodes[j], distance);
        }
    }

    graph
}
