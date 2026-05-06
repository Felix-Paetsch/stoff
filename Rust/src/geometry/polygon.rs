use crate::geometry::{line_segment::LineSegment, polyline::Polyline, vertex::Vertex};

// The first and last vertex are not necessarily identical.
// A polygon can't have precicely one vertex
#[derive(Clone)]
pub struct Polygon(pub Vec<Vertex>);

impl Polygon {
    pub fn new(mut ver: Vec<Vertex>) -> Polygon {
        if ver.len() == 1 {
            ver.push(ver[0]);
        }

        Polygon(ver)
    }

    pub fn empty() -> Polygon {
        Polygon(vec![])
    }

    pub fn lines(&self) -> impl Iterator<Item = LineSegment> + '_ {
        self.0
            .windows(2)
            .map(|window| LineSegment::new(window[0], window[1]))
            .chain(
                self.0
                    .first()
                    .zip(self.0.last())
                    .map(|(first, last)| LineSegment::new(*last, *first)),
            )
    }
}

impl From<Polygon> for geo::Polygon {
    fn from(poly: Polygon) -> geo::Polygon {
        let polyline = Polyline::from(poly);
        let exterior: geo::LineString = polyline.into();
        geo::Polygon::new(exterior, vec![])
    }
}

impl From<geo::Polygon> for Polygon {
    fn from(poly: geo::Polygon) -> Polygon {
        let (outer, _) = poly.into_inner();
        let polyline = Polyline::from(outer);
        Polygon::from(polyline)
    }
}

impl From<Polygon> for Vec<Vertex> {
    fn from(p: Polygon) -> Self {
        p.0
    }
}

impl From<Polyline> for Polygon {
    fn from(v: Polyline) -> Self {
        let mut verts: Vec<Vertex> = v.0;
        if verts.last().unwrap() == verts.first().unwrap() && verts.len() > 3 {
            verts.pop();
        }
        Polygon(verts)
    }
}
