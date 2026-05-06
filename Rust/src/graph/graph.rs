use petgraph::{graph::NodeIndex, visit::EdgeRef, Undirected};

use crate::{
    geometry::vertex::Vertex,
    graph::{graph_edge::GraphEdge, graph_node::GraphNode},
};

pub struct Graph {
    pub nodes: Vec<GraphNode>,
    pub edges: Vec<GraphEdge>,
}

impl Graph {
    pub fn new(vertices: Vec<Vertex>, edges: Vec<[usize; 2]>) -> Self {
        let nodes = vertices
            .into_iter()
            .enumerate()
            .map(|(i, v)| GraphNode { vec: v, index: i })
            .collect();

        let mapped_edges = edges
            .into_iter()
            .enumerate()
            .map(|(i, e)| GraphEdge {
                end_indices: e,
                index: i,
            })
            .collect();

        Graph {
            nodes,
            edges: mapped_edges,
        }
    }

    pub fn empty() -> Self {
        Graph {
            nodes: vec![],
            edges: vec![],
        }
    }

    pub fn with_capacity(node: usize, edge: usize) -> Self {
        Graph {
            nodes: Vec::with_capacity(node),
            edges: Vec::with_capacity(edge),
        }
    }

    pub fn full(vertices: Vec<Vertex>) -> Self {
        let vert_count = vertices.len();

        let nodes = vertices
            .into_iter()
            .enumerate()
            .map(|(i, v)| GraphNode { vec: v, index: i })
            .collect();

        let edges: Vec<GraphEdge> = (0..vert_count)
            .flat_map(|i| {
                ((i + 1)..vert_count)
                    .enumerate()
                    .map(move |(index, j)| GraphEdge {
                        end_indices: [i, j],
                        index,
                    })
            })
            .collect();

        Graph { nodes, edges }
    }

    pub fn serialize(&self) -> Vec<f64> {
        self.into()
    }

    pub fn deserialize(from: &[f64]) -> Option<Self> {
        Self::try_from(from).ok()
    }

    pub fn vertices(&self) -> impl Iterator<Item = &Vertex> {
        self.nodes.iter().map(|n| &n.vec)
    }

    pub fn into_vertices(self) -> Vec<Vertex> {
        self.nodes.into_iter().map(|n| n.vec).collect()
    }

    pub fn is_empty(&self) -> bool {
        self.nodes.is_empty()
    }

    pub fn node_count(&self) -> usize {
        self.nodes.len()
    }

    pub fn edge_count(&self) -> usize {
        self.edges.len()
    }

    pub fn into_verticies(self) -> Vec<Vertex> {
        self.into_vertices()
    }

    pub fn vertex_at(&self, i: usize) -> Option<Vertex> {
        self.nodes.get(i).map(|v| v.vec)
    }

    pub fn edges_at(&self, vertex_index: usize) -> impl Iterator<Item = &GraphEdge> {
        self.edges.iter().filter(move |edge| {
            edge.end_indices[0] == vertex_index || edge.end_indices[1] == vertex_index
        })
    }

    pub fn edge_endpoints(&self, edge: &GraphEdge) -> Option<[&GraphNode; 2]> {
        let n1 = self.nodes.get(edge.end_indices[0]);
        let n2 = self.nodes.get(edge.end_indices[1]);
        match (n1, n2) {
            (Some(node1), Some(node2)) => Some([node1, node2]),
            _ => None,
        }
    }

    pub fn edge_from_index(&self, edge_index: usize) -> Option<&GraphEdge> {
        self.edges.get(edge_index)
    }

    pub fn add_node(&mut self, v: Vertex) {
        self.nodes.push(GraphNode {
            vec: v,
            index: self.node_count(),
        })
    }

    pub fn add_edge(&mut self, from: usize, to: usize) {
        if usize::max(from, to) < self.node_count() {
            self.edges.push(GraphEdge {
                end_indices: [from, to],
                index: self.edge_count(),
            })
        }
    }
}

impl TryFrom<&[f64]> for Graph {
    type Error = String;

    // Encoding:
    // [#num_vertices, v1x, v1y, v2x, v2y, ..., edge1Start, edge1End, edge2Start, edge2End, ...]
    fn try_from(coords: &[f64]) -> Result<Self, Self::Error> {
        if coords.is_empty() {
            return Err("input is empty".to_string());
        }

        let num_vertices_f = coords[0];
        if num_vertices_f < 0.0 || num_vertices_f.fract() != 0.0 {
            return Err("number of vertices must be a non-negative integer".to_string());
        }

        let num_vertices = num_vertices_f as usize;
        let vertex_data_len = 1 + num_vertices * 2;

        if coords.len() < vertex_data_len {
            return Err(format!(
                "input too short: expected at least {vertex_data_len} values for {num_vertices} vertices, got {}",
                coords.len()
            ));
        }

        let edge_data_len = coords.len() - vertex_data_len;
        if !edge_data_len.is_multiple_of(2) {
            return Err("edge list must contain an even number of values".to_string());
        }

        let mut nodes = Vec::with_capacity(num_vertices);
        for i in 0..num_vertices {
            let x = coords[1 + 2 * i];
            let y = coords[1 + 2 * i + 1];

            nodes.push(GraphNode {
                vec: Vertex { x, y },
                index: i,
            });
        }

        let mut edges = Vec::with_capacity(edge_data_len / 2);
        for i in (vertex_data_len..coords.len()).step_by(2) {
            let a_f = coords[i];
            let b_f = coords[i + 1];

            if a_f < 0.0 || a_f.fract() != 0.0 || b_f < 0.0 || b_f.fract() != 0.0 {
                return Err(format!(
                    "edge endpoints must be non-negative integers, got [{a_f}, {b_f}]"
                ));
            }

            let a = a_f as usize;
            let b = b_f as usize;

            if a >= num_vertices || b >= num_vertices {
                return Err(format!(
                    "edge endpoint out of bounds: [{a}, {b}] for {num_vertices} vertices"
                ));
            }

            edges.push(GraphEdge {
                end_indices: [a, b],
                index: i,
            });
        }

        Ok(Graph { nodes, edges })
    }
}

impl From<&Graph> for Vec<f64> {
    fn from(graph: &Graph) -> Self {
        let node_count = graph.nodes.len();
        let mut out = Vec::with_capacity(1 + node_count * 2 + graph.edges.len() * 2);

        out.push(node_count as f64);

        for node in &graph.nodes {
            out.push(node.vec.x);
            out.push(node.vec.y);
        }

        for edge in &graph.edges {
            out.push(edge.end_indices[0] as f64);
            out.push(edge.end_indices[1] as f64);
        }

        out
    }
}

impl From<&petgraph::graph::Graph<Vertex, (), Undirected>> for Graph {
    fn from(inner: &petgraph::graph::Graph<Vertex, (), Undirected>) -> Self {
        let nodes: Vec<GraphNode> = inner
            .node_indices()
            .enumerate()
            .map(|(i, idx)| GraphNode {
                vec: inner[idx],
                index: i,
            })
            .collect();

        let edges: Vec<GraphEdge> = inner
            .edge_references()
            .enumerate()
            .map(|(index, edge)| GraphEdge {
                end_indices: [edge.source().index(), edge.target().index()],
                index,
            })
            .collect();

        Graph { nodes, edges }
    }
}

impl From<&Graph> for petgraph::graph::Graph<Vertex, (), Undirected> {
    fn from(graph: &Graph) -> Self {
        let mut inner = petgraph::graph::Graph::<Vertex, (), Undirected>::new_undirected();
        let mut node_indices = Vec::<NodeIndex>::with_capacity(graph.nodes.len());

        for node in &graph.nodes {
            let idx = inner.add_node(node.vec);
            node_indices.push(idx);
        }

        for edge in &graph.edges {
            let a = edge.end_indices[0];
            let b = edge.end_indices[1];

            if a < node_indices.len() && b < node_indices.len() {
                inner.add_edge(node_indices[a], node_indices[b], ());
            }
        }

        inner
    }
}
