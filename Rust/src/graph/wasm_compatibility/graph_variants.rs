use std::collections::HashMap;

use petgraph::{graph::NodeIndex, Graph, Undirected};

use crate::{
    geometry::Vector,
    graph::wasm_compatibility::{
        transmittable_graph_edges::{WASMEdge, WASMTransmittableEdges},
        WASMNode, WASMTransmittableGraph, WASMTransmittableNodes,
    },
};

impl From<WASMTransmittableGraph> for Graph<WASMNode<Vector>, WASMEdge, Undirected> {
    fn from(g: WASMTransmittableGraph) -> Self {
        match (g.nodes, g.edges) {
            (WASMTransmittableNodes::Vector(nodes), WASMTransmittableEdges::Id(edges)) => {
                create_petgraph(nodes, edges)
            }
            _ => unreachable!(),
        }
    }
}

impl From<WASMTransmittableGraph> for Graph<WASMNode, WASMEdge<f64>, Undirected> {
    fn from(g: WASMTransmittableGraph) -> Self {
        match (g.nodes, g.edges) {
            (WASMTransmittableNodes::Id(nodes), WASMTransmittableEdges::Length(edges)) => {
                create_petgraph(nodes, edges)
            }
            _ => unreachable!(),
        }
    }
}

fn create_petgraph<NodeData, EdgeData>(
    nodes: Vec<WASMNode<NodeData>>,
    edges: Vec<WASMEdge<EdgeData>>,
) -> Graph<WASMNode<NodeData>, WASMEdge<EdgeData>, Undirected> {
    let mut graph = Graph::<WASMNode<NodeData>, WASMEdge<EdgeData>, Undirected>::new_undirected();

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
