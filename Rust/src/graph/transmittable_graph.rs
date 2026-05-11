use crate::{
    geometry::{geometry::Geometry, shape::Shape, vertex::Vertex},
    graph::transmittable_graph_edges::{EdgeF, TransmittableEdges},
};

#[derive(Clone)]
pub struct NodeF<NodeType = ()> {
    pub id: u32,
    pub data: NodeType,
}
pub type NodeFs<NodeType = ()> = Vec<NodeF<NodeType>>;

pub enum TransmittableNodes {
    Id(NodeFs),
    Vertex(NodeFs<Vertex>),
}

pub struct TransmittableGraph {
    pub nodes: TransmittableNodes,
    pub edges: TransmittableEdges,
}

/*
 *
 * The serialized form of a transmittable graph looks as follows:
 * [NoeType, EdgeType, VertexCount, ...serializedVerticies, ...serializedEdges]
 *
 * Sending **FROM JS TO WASM** it looks like this:
 * ===============================================
 *
 * NodeType:
 *    0 - Id
 *    1 - Vertex
 *
 * EdgeType:
 *    0 - Id
 *    1 - Shape
 *    2 - Length
 *
 * VertexCount: u32 as f64, how many verticies there are
 *
 * serializedVerticies:
 *    Id - NOTHING
 *    Vertex - a list of ...[v.x, v.y]
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

impl TransmittableGraph {
    pub fn serialize(&self) -> Vec<f64> {
        let node_type = match &self.nodes {
            TransmittableNodes::Id(_) => 0.0,
            TransmittableNodes::Vertex(_) => 1.0,
        };

        let edge_type = match &self.edges {
            TransmittableEdges::Id(_) => 0.0,
            TransmittableEdges::Shape(_) => 1.0,
            TransmittableEdges::Length(_) => 2.0,
        };

        let node_count = match &self.nodes {
            TransmittableNodes::Id(nodes) => nodes.len(),
            TransmittableNodes::Vertex(nodes) => nodes.len(),
        };

        let mut out = Vec::new();
        out.push(node_type);
        out.push(edge_type);
        out.push(node_count as f64);

        match &self.nodes {
            TransmittableNodes::Id(nodes) => {
                for node in nodes {
                    out.push(node.id as f64);
                }
            }
            TransmittableNodes::Vertex(nodes) => {
                for node in nodes {
                    out.push(node.id as f64);
                    out.push(node.data.x);
                    out.push(node.data.y);
                }
            }
        }

        match &self.edges {
            TransmittableEdges::Id(edges) => {
                for edge in edges {
                    out.push(edge.id as f64);
                    out.push(edge.endpoints[0] as f64);
                    out.push(edge.endpoints[1] as f64);
                }
            }
            TransmittableEdges::Shape(edges) => {
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
            TransmittableEdges::Length(edges) => {
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

    pub fn deserialize(serialized: &[f64]) -> TransmittableGraph {
        let node_type = serialized[0] as u32;
        let edge_type = serialized[1] as u32;
        let node_count = serialized[2] as usize;

        let mut index = 3;

        let nodes = match node_type {
            0 => {
                let mut nodes = Vec::with_capacity(node_count);

                for id in 0..node_count {
                    nodes.push(NodeF {
                        id: id as u32,
                        data: (),
                    });
                }

                TransmittableNodes::Id(nodes)
            }
            1 => {
                let mut nodes = Vec::with_capacity(node_count);

                for id in 0..node_count {
                    let x = serialized[index];
                    let y = serialized[index + 1];
                    index += 2;

                    nodes.push(NodeF {
                        id: id as u32,
                        data: Vertex::new(x, y),
                    });
                }

                TransmittableNodes::Vertex(nodes)
            }
            _ => unreachable!(),
        };

        let edges = match edge_type {
            0 => {
                let remaining = &serialized[index..];
                let mut edges = Vec::with_capacity(remaining.len() / 2);

                for (id, chunk) in remaining.chunks_exact(2).enumerate() {
                    edges.push(EdgeF {
                        id: id as u32,
                        endpoints: [chunk[0] as u32, chunk[1] as u32],
                        data: (),
                    });
                }

                TransmittableEdges::Id(edges)
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

                    let geometry = Geometry::deserialize(&serialized[shape_start..index]).unwrap();
                    let shape = Shape::from_geometry(geometry).unwrap();

                    edges.push(EdgeF {
                        id: edge_id,
                        endpoints: [start, end],
                        data: shape,
                    });

                    edge_id += 1;
                    index += 1;
                }

                TransmittableEdges::Shape(edges)
            }
            2 => {
                let remaining = &serialized[index..];
                let mut edges = Vec::with_capacity(remaining.len() / 3);

                for (id, chunk) in remaining.chunks_exact(3).enumerate() {
                    edges.push(EdgeF {
                        id: id as u32,
                        endpoints: [chunk[0] as u32, chunk[1] as u32],
                        data: chunk[2],
                    });
                }

                TransmittableEdges::Length(edges)
            }
            _ => unreachable!(),
        };

        TransmittableGraph { nodes, edges }
    }

    pub fn serialize_node_subset<NodeType>(nodes: &[NodeF<NodeType>]) -> Vec<u32> {
        let mut out = Vec::with_capacity(1 + nodes.len());
        out.push(0);
        out.extend(nodes.iter().map(|n| n.id));
        out
    }

    pub fn serialize_edge_subset<EdgeType>(edges: &[EdgeF<EdgeType>]) -> Vec<u32> {
        let mut out = Vec::with_capacity(1 + edges.len());
        out.push(1);
        out.extend(edges.iter().map(|e| e.id));
        out
    }

    pub fn serialize_subgraph<NodeType, EdgeType>(
        nodes: &[NodeF<NodeType>],
        edges: &[EdgeF<EdgeType>],
    ) -> Vec<u32> {
        let mut out = Vec::with_capacity(1 + nodes.len() + edges.len());
        out.push(2);
        out.push(nodes.len() as u32);
        out.extend(nodes.iter().map(|n| n.id));
        out.extend(edges.iter().map(|e| e.id));
        out
    }
}
