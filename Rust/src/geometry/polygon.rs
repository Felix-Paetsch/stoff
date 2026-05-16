use crate::geometry::{
    line_segment::LineSegment, polyline::Polyline, shape_trait::ShapeT, vector::Vector,
};

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
    fn lines(&self) -> Vec<LineSegment> {
        self.0
            .windows(2)
            .map(|window| LineSegment::new(window[0], window[1]))
            .chain(
                self.0
                    .first()
                    .zip(self.0.last())
                    .map(|(first, last)| LineSegment::new(*last, *first)),
            )
            .collect()
    }

    fn vertices(&self) -> &[Vector] {
        &self.0
    }

    fn into_vertices(self) -> Vec<Vector> {
        self.0
    }

    fn is_polyline(&self) -> bool {
        true
    }
}

impl From<Polygon> for geo::Polygon {
    fn from(poly: Polygon) -> geo::Polygon {
        let polyline = poly.into_polyline();
        let exterior: geo::LineString = polyline.into();
        geo::Polygon::new(exterior, vec![])
    }
}

impl From<geo::Polygon> for Polygon {
    fn from(poly: geo::Polygon) -> Polygon {
        let (outer, _) = poly.into_inner();
        let polyline = Polyline::from(outer);
        polyline.into_polygon()
    }
}
