use crate::Vector;
use petgraph::{Graph, Undirected};

pub fn distance_graph(verts: &[Vector]) -> Graph<(), f64, Undirected> {
    if verts.is_empty() {
        return Graph::<(), f64, Undirected>::default();
    }

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
