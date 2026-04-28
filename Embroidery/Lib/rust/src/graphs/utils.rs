use petgraph::graph::UnGraph;

use crate::vertex::Vertex;

pub fn complete_graph(vertices: &[Vertex]) -> UnGraph<Vertex, ()>
where
    Vertex: Clone,
{
    let mut g = UnGraph::<Vertex, ()>::default();
    let nodes: Vec<_> = vertices.iter().cloned().map(|v| g.add_node(v)).collect();
    let n = nodes.len();

    for i in 0..n {
        for j in (i + 1)..n {
            g.add_edge(nodes[i], nodes[j], ());
        }
    }

    g
}
