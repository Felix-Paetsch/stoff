use crate::geometry::vertex::Vertex;

#[derive(Clone)]
pub struct GraphNode {
    pub vec: Vertex,
    pub index: usize,
}
