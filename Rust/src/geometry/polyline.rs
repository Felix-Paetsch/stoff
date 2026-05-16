use geo::CoordsIter;

use crate::geometry::shape_trait::ShapeT;

use super::{line_segment::LineSegment, vector::Vector};

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
    fn lines(&self) -> Vec<LineSegment> {
        self.0
            .windows(2)
            .map(|window| LineSegment::new(window[0], window[1]))
            .collect()
    }

    fn vertices(&self) -> &[Vector] {
        &self.0
    }

    fn is_polyline(&self) -> bool {
        true
    }

    fn into_vertices(self) -> Vec<Vector> {
        self.0
    }
}

impl From<Polyline> for geo::LineString {
    fn from(pl: Polyline) -> geo::LineString {
        geo::LineString::new(pl.0.iter().map(|v| (*v).into()).collect())
    }
}

impl From<geo::LineString> for Polyline {
    fn from(pl: geo::LineString) -> Polyline {
        Polyline::new(pl.coords_iter().map(|c| Vector::from(c)).collect())
    }
}
