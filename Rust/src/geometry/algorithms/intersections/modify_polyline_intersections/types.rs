use crate::geometry::vector::Vector;

#[derive(Clone, Copy)]
pub enum EdgeGrouping {
    NoOffset,
    Offset,
}

impl EdgeGrouping {
    pub fn flip(&mut self) {
        *self = match self {
            EdgeGrouping::NoOffset => EdgeGrouping::Offset,
            EdgeGrouping::Offset => EdgeGrouping::NoOffset,
        }
    }
}

#[derive(Clone, Copy)]
pub enum NextEdgeRule {
    Adjacent,
    Skip,
}

pub struct ShapeGraphEdge {
    pub subshape: Vec<Vector>,
    pub next_node_index: usize,
    pub next_node_edge_index: usize,
}

pub type ShapeGraphNode = Vec<ShapeGraphEdge>;
pub type ShapeGraph = Vec<ShapeGraphNode>;

// =====

pub struct TraversalEdgeIdent {
    pub next_node_index: usize,
    pub next_node_edge_index: usize,
}

impl ShapeGraphEdge {
    pub fn into_traversal_edge_ident(&self) -> TraversalEdgeIdent {
        TraversalEdgeIdent {
            next_node_index: self.next_node_index,
            next_node_edge_index: self.next_node_edge_index,
        }
    }
}

pub struct TraversalShapeGraphNode {
    pub edges: Vec<ShapeGraphEdge>,
    pub grouping: EdgeGrouping,
    pub visited: Vec<bool>,
}
