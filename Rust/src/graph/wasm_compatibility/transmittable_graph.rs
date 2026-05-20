use super::transmittable_graph_edges::{WASMEdge, WASMTransmittableEdges};
use crate::geometry::{Geometry, Shape, Vector};

#[derive(Clone)]
pub struct WASMNode<NodeType = ()> {
    pub id: u32,
    pub data: NodeType,
}
type NodeFs<NodeType = ()> = Vec<WASMNode<NodeType>>;

pub enum WASMTransmittableNodes {
    Id(NodeFs),
    Vector(NodeFs<Vector>),
}

pub struct WASMTransmittableGraph {
    pub nodes: WASMTransmittableNodes,
    pub edges: WASMTransmittableEdges,
}

/*
 *
 * The serialized form of a transmittable graph looks as follows:
 * [NoeType, EdgeType, VectorCount, ...serializedVerticies, ...serializedEdges]
 *
 * Sending **FROM JS TO WASM** it looks like this:
 * ===============================================
 *
 * NodeType:
 *    0 - Id
 *    1 - Vector
 *
 * EdgeType:
 *    0 - Id
 *    1 - Shape
 *    2 - Length
 *
 * VectorCount: u32 as f64, how many verticies there are
 *
 * serializedVerticies:
 *    Id - NOTHING
 *    Vector - a list of ...[v.x, v.y]
 *    (In both cases total length is known and the indices are infered by order 0, ...)
 *
 * serializedEdges:
 *    Id - a list of ...[
 *      (u32 as f64) start_node,
 *      (u32 as f64) end_node
 *    ]
 *    Shape - a list of ...[
 *      (u32 as f64) start_node,
 *      (u32 as f64) end_node,
 *      ...serializedShape,
 *      NaN
 *     ]
 *    Length - a list of ...[
 *      (u32 as f64) start_node,
 *      (u32 as f64) end_node,
 *      f64 length
 *    ]
 *    (For Id and length it is clear when an edge ends. For shape this is marked with the final NaN;
 *    again the indices are given by order)
 *
 *
 * Sending **FROM WASM TO JS** it looks the same way, except:
 * ==========================================================
 *
 * - each vertex has aditionally before its above data its id (u32 as f64)
 * - each line has additionally before its above data its id (u32 as f64)
 *
 * */

impl WASMTransmittableGraph {
    pub fn serialize(&self) -> Vec<f64> {
        let node_type = match &self.nodes {
            WASMTransmittableNodes::Id(_) => 0.0,
            WASMTransmittableNodes::Vector(_) => 1.0,
        };

        let edge_type = match &self.edges {
            WASMTransmittableEdges::Id(_) => 0.0,
            WASMTransmittableEdges::Shape(_) => 1.0,
            WASMTransmittableEdges::Length(_) => 2.0,
        };

        let node_count = match &self.nodes {
            WASMTransmittableNodes::Id(nodes) => nodes.len(),
            WASMTransmittableNodes::Vector(nodes) => nodes.len(),
        };

        let mut out = Vec::new();
        out.push(node_type);
        out.push(edge_type);
        out.push(node_count as f64);

        match &self.nodes {
            WASMTransmittableNodes::Id(nodes) => {
                for node in nodes {
                    out.push(node.id as f64);
                }
            }
            WASMTransmittableNodes::Vector(nodes) => {
                for node in nodes {
                    out.push(node.id as f64);
                    out.push(node.data.x());
                    out.push(node.data.y());
                }
            }
        }

        match &self.edges {
            WASMTransmittableEdges::Id(edges) => {
                let extend_with: Vec<f64> = edges
                    .iter()
                    .flat_map(|edge| {
                        [
                            edge.id as f64,
                            edge.endpoints[0] as f64,
                            edge.endpoints[1] as f64,
                        ]
                    })
                    .collect();
                out.extend(extend_with);
            }
            WASMTransmittableEdges::Shape(edges) => {
                for edge in edges {
                    out.push(edge.id as f64);
                    out.push(edge.endpoints[0] as f64);
                    out.push(edge.endpoints[1] as f64);

                    let geometry: Geometry = match &edge.data {
                        Shape::Polyline(polyline) => polyline.clone().into(),
                        Shape::Polygon(polygon) => polygon.clone().into(),
                    };

                    out.extend(geometry.serialize());
                    out.push(f64::NAN);
                }
            }
            WASMTransmittableEdges::Length(edges) => {
                for edge in edges {
                    out.push(edge.id as f64);
                    out.push(edge.endpoints[0] as f64);
                    out.push(edge.endpoints[1] as f64);
                    out.push(edge.data);
                }
            }
        }

        out
    }

    pub fn deserialize(serialized: &[f64]) -> WASMTransmittableGraph {
        let node_type = serialized[0] as u32;
        let edge_type = serialized[1] as u32;
        let node_count = serialized[2] as usize;

        let mut index = 3;

        let nodes = match node_type {
            0 => {
                let mut nodes = Vec::with_capacity(node_count);

                for id in 0..node_count {
                    nodes.push(WASMNode {
                        id: id as u32,
                        data: (),
                    });
                }

                WASMTransmittableNodes::Id(nodes)
            }
            1 => {
                let mut nodes = Vec::with_capacity(node_count);

                for id in 0..node_count {
                    let x = serialized[index];
                    let y = serialized[index + 1];
                    index += 2;

                    nodes.push(WASMNode {
                        id: id as u32,
                        data: Vector::new(x, y),
                    });
                }

                WASMTransmittableNodes::Vector(nodes)
            }
            _ => unreachable!(),
        };

        let edges = match edge_type {
            0 => {
                let remaining = &serialized[index..];
                let mut edges = Vec::with_capacity(remaining.len() / 2);

                for (id, chunk) in remaining.chunks_exact(2).enumerate() {
                    edges.push(WASMEdge {
                        id: id as u32,
                        endpoints: [chunk[0] as u32, chunk[1] as u32],
                        data: (),
                    });
                }

                WASMTransmittableEdges::Id(edges)
            }
            1 => {
                let mut edges = Vec::new();
                let mut edge_id = 0u32;

                while index < serialized.len() {
                    let start = serialized[index] as u32;
                    let end = serialized[index + 1] as u32;
                    index += 2;

                    let shape_start = index;

                    while !serialized[index].is_nan() {
                        index += 1;
                    }

                    let geometry = Geometry::deserialize(&serialized[shape_start..index]);
                    let shape = Shape::from_geometry(geometry).unwrap();

                    edges.push(WASMEdge {
                        id: edge_id,
                        endpoints: [start, end],
                        data: shape,
                    });

                    edge_id += 1;
                    index += 1;
                }

                WASMTransmittableEdges::Shape(edges)
            }
            2 => {
                let remaining = &serialized[index..];
                let mut edges = Vec::with_capacity(remaining.len() / 3);

                for (id, chunk) in remaining.chunks_exact(3).enumerate() {
                    edges.push(WASMEdge {
                        id: id as u32,
                        endpoints: [chunk[0] as u32, chunk[1] as u32],
                        data: chunk[2],
                    });
                }

                WASMTransmittableEdges::Length(edges)
            }
            _ => unreachable!(),
        };

        WASMTransmittableGraph { nodes, edges }
    }

    pub fn serialize_node_subset<NodeType>(nodes: &[WASMNode<NodeType>]) -> Vec<u32> {
        let mut out = Vec::with_capacity(1 + nodes.len());
        out.push(0);
        out.extend(nodes.iter().map(|n| n.id));
        out
    }

    pub fn serialize_edge_subset<EdgeType>(edges: &[WASMEdge<EdgeType>]) -> Vec<u32> {
        let mut out = Vec::with_capacity(1 + edges.len());
        out.push(1);
        out.extend(edges.iter().map(|e| e.id));
        out
    }

    pub fn serialize_subgraph<NodeType, EdgeType>(
        nodes: &[WASMNode<NodeType>],
        edges: &[WASMEdge<EdgeType>],
    ) -> Vec<u32> {
        let mut out = Vec::with_capacity(1 + nodes.len() + edges.len());
        out.push(2);
        out.push(nodes.len() as u32);
        out.extend(nodes.iter().map(|n| n.id));
        out.extend(edges.iter().map(|e| e.id));
        out
    }
}
