use std::cmp::Ordering;

use crate::geometry::Shape;

#[derive(Clone)]
pub struct WASMEdge<EdgeType = ()> {
    pub id: u32,
    pub endpoints: [u32; 2],
    pub data: EdgeType,
}
type EdgesF<EdgeType = ()> = Vec<WASMEdge<EdgeType>>;

pub enum WASMTransmittableEdges {
    Id(EdgesF),
    Shape(EdgesF<Shape>),
    Length(EdgesF<f64>),
}

impl<T: PartialEq> PartialEq for WASMEdge<T> {
    fn eq(&self, other: &Self) -> bool {
        self.data.eq(&other.data)
    }
}

impl<T: PartialOrd> PartialOrd for WASMEdge<T> {
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
        self.data.partial_cmp(&other.data)
    }
}

impl<T: Eq> Eq for WASMEdge<T> {}

impl<T: Ord> Ord for WASMEdge<T> {
    fn cmp(&self, other: &Self) -> Ordering {
        self.data.cmp(&other.data)
    }
}
