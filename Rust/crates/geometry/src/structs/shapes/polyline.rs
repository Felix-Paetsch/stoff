use crate::Vector;

pub use super::ShapeT;

// A polyline cant have precicely one vertex
#[derive(Clone)]
pub struct Polyline(Vec<Vector>);

impl Polyline {
    pub fn new(mut ver: Vec<Vector>) -> Polyline {
        if ver.len() == 1 {
            ver.push(ver[0]);
        }

        Polyline(ver)
    }

    pub fn empty() -> Polyline {
        Polyline(vec![])
    }

    pub fn first(&self) -> Option<Vector> {
        self.0.first().copied()
    }

    pub fn last(&self) -> Option<Vector> {
        self.0.last().copied()
    }
}

impl ShapeT for Polyline {
    #[inline]
    fn vertices(&self) -> &[Vector] {
        &self.0
    }

    fn into_vertices(self) -> Vec<Vector> {
        self.0
    }

    fn is_polyline(&self) -> bool {
        true
    }

    fn into_polyline(self) -> Polyline {
        self
    }
}
