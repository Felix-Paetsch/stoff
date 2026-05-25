use geo::CoordsIter;

pub use super::ShapeT;
use super::{LineSegment, Vector};

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
}

impl ShapeT for Polyline {
    fn lines(&self) -> Box<dyn Iterator<Item = LineSegment> + '_> {
        Box::new(
            self.0
                .windows(2)
                .map(|window| LineSegment::new(window[0], window[1])),
        )
    }

    fn vertices(&self) -> Box<dyn Iterator<Item = Vector> + '_> {
        Box::new(self.0.iter().copied())
    }

    fn is_polyline(&self) -> bool {
        true
    }

    fn into_vertices(self) -> Vec<Vector> {
        self.0
    }

    fn vertex_count(&self) -> usize {
        self.0.len()
    }

    fn vertex_at(&self, at: usize) -> Vector {
        self.0[at]
    }
}

impl From<Polyline> for geo::LineString {
    fn from(pl: Polyline) -> geo::LineString {
        geo::LineString::new(pl.0.iter().map(|v| (*v).into()).collect())
    }
}

impl From<geo::LineString> for Polyline {
    fn from(pl: geo::LineString) -> Polyline {
        Polyline::new(pl.coords_iter().map(Vector::from).collect())
    }
}
