use crate::geometry::shape::Shape;
use std::cmp::Ordering;

#[derive(Clone)]
pub struct EdgeF<EdgeType = ()> {
    pub id: u32,
    pub endpoints: [u32; 2],
    pub data: EdgeType,
}
pub type EdgesF<EdgeType = ()> = Vec<EdgeF<EdgeType>>;

pub enum TransmittableEdges {
    Id(EdgesF),
    Shape(EdgesF<Shape>),
    Length(EdgesF<f64>),
}

impl<T: PartialEq> PartialEq for EdgeF<T> {
    fn eq(&self, other: &Self) -> bool {
        self.data.eq(&other.data)
    }
}

impl<T: PartialOrd> PartialOrd for EdgeF<T> {
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
        self.data.partial_cmp(&other.data)
    }
}

impl<T: Eq> Eq for EdgeF<T> {}

impl<T: Ord> Ord for EdgeF<T> {
    fn cmp(&self, other: &Self) -> Ordering {
        self.data.cmp(&other.data)
    }
}
