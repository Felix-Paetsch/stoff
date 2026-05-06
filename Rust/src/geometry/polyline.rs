use geo::CoordsIter;

use crate::geometry::{line_segment::LineSegment, polygon::Polygon, vertex::Vertex};

// A polyline cant have precicely one vertex
#[derive(Clone)]
pub struct Polyline(pub Vec<Vertex>);

impl Polyline {
    pub fn new(mut ver: Vec<Vertex>) -> Polyline {
        if ver.len() == 1 {
            ver.push(ver[0]);
        }

        Polyline(ver)
    }

    pub fn empty() -> Polyline {
        Polyline(vec![])
    }

    pub fn lines(&self) -> impl Iterator<Item = LineSegment> + '_ {
        self.0
            .windows(2)
            .map(|window| LineSegment::new(window[0], window[1]))
    }
}

impl From<Polyline> for geo::LineString {
    fn from(pl: Polyline) -> geo::LineString {
        geo::LineString::new(pl.0.iter().map(|v| (*v).into()).collect())
    }
}

impl From<geo::LineString> for Polyline {
    fn from(pl: geo::LineString) -> Polyline {
        Polyline(pl.coords_iter().map(|c| Vertex::from(c)).collect())
    }
}

impl From<Polyline> for Vec<Vertex> {
    fn from(v: Polyline) -> Self {
        v.0
    }
}

impl From<Polygon> for Polyline {
    fn from(v: Polygon) -> Self {
        Polyline(v.0)
    }
}
