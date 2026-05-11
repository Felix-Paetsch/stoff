use std::collections::HashMap;

use petgraph::{graph::NodeIndex, Graph, Undirected};

use crate::{
    geometry::vertex::Vertex,
    graph::{
        transmittable_graph::{NodeF, TransmittableGraph, TransmittableNodes},
        transmittable_graph_edges::{EdgeF, TransmittableEdges},
    },
};

impl From<TransmittableGraph> for Graph<NodeF<Vertex>, EdgeF, Undirected> {
    fn from(g: TransmittableGraph) -> Self {
        match (g.nodes, g.edges) {
            (TransmittableNodes::Vertex(nodes), TransmittableEdges::Id(edges)) => {
                create_petgraph(nodes, edges)
            }
            _ => unreachable!(),
        }
    }
}

impl From<TransmittableGraph> for Graph<NodeF, EdgeF<f64>, Undirected> {
    fn from(g: TransmittableGraph) -> Self {
        match (g.nodes, g.edges) {
            (TransmittableNodes::Id(nodes), TransmittableEdges::Length(edges)) => {
                create_petgraph(nodes, edges)
            }
            _ => unreachable!(),
        }
    }
}

pub fn create_petgraph<NodeData, EdgeData>(
    nodes: Vec<NodeF<NodeData>>,
    edges: Vec<EdgeF<EdgeData>>,
) -> Graph<NodeF<NodeData>, EdgeF<EdgeData>, Undirected> {
    let mut graph = Graph::<NodeF<NodeData>, EdgeF<EdgeData>, Undirected>::new_undirected();

    let mut id_to_index = HashMap::<u32, NodeIndex>::with_capacity(nodes.len());

    for node in nodes {
        let id = node.id;
        let index = graph.add_node(node);
        id_to_index.insert(id, index);
    }

    for edge in edges {
        let start = id_to_index[&edge.endpoints[0]];
        let end = id_to_index[&edge.endpoints[1]];
        graph.add_edge(start, end, edge);
    }

    graph
}
