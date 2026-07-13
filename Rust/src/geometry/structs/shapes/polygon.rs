pub use super::ShapeT;
use crate::geometry::*;

// The first and last vertex are not necessarily identical.
// A polygon can't have precicely one vertex
#[derive(Clone)]
pub struct Polygon(Vec<Vector>);

impl Polygon {
    pub fn new(mut ver: Vec<Vector>) -> Polygon {
        if ver.len() == 1 {
            ver.push(ver[0]);
        }

        Polygon(ver)
    }

    pub fn empty() -> Polygon {
        Polygon(vec![])
    }
}

impl ShapeT for Polygon {
    #[inline]
    fn vertices(&self) -> &[Vector] {
        &self.0
    }

    fn into_vertices(self) -> Vec<Vector> {
        self.0
    }

    fn is_polyline(&self) -> bool {
        false
    }

    fn into_polygon(self) -> Polygon {
        self
    }
}
