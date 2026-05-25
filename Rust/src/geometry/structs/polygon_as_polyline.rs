use crate::geometry::{LineSegment, Polygon, ShapeT, Vector};

pub struct PolygonAsPolyline<'a>(&'a Polygon);
impl<'a> PolygonAsPolyline<'a> {
    pub fn new(l: &'a Polygon) -> PolygonAsPolyline<'a> {
        PolygonAsPolyline(l)
    }
}

impl<'a> ShapeT for PolygonAsPolyline<'a> {
    fn lines(&self) -> Box<dyn Iterator<Item = LineSegment> + '_> {
        self.0.lines()
    }

    fn vertices(&self) -> Box<dyn Iterator<Item = Vector> + '_> {
        if self.0.is_empty() {
            self.0.vertices()
        } else {
            Box::new(
                self.0
                    .vertices()
                    .chain(std::iter::once(self.0.vertex_at(0))),
            )
        }
    }

    fn into_vertices(self) -> Vec<Vector> {
        self.vertices().collect()
    }

    fn is_polyline(&self) -> bool {
        false
    }

    fn vertex_count(&self) -> usize {
        self.0.vertex_count()
    }

    fn vertex_at(&self, at: usize) -> Vector {
        self.0.vertex_at(at % self.vertex_count())
    }
}

