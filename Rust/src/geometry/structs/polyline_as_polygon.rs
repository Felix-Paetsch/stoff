use crate::geometry::{LineSegment, Polyline, ShapeT, Vector};

pub struct PolylineAsPolygon<'a>(&'a Polyline);
impl<'a> PolylineAsPolygon<'a> {
    pub fn new(l: &'a Polyline) -> PolylineAsPolygon<'a> {
        PolylineAsPolygon(l)
    }
}

impl<'a> ShapeT for PolylineAsPolygon<'a> {
    fn lines(&self) -> Box<dyn Iterator<Item = LineSegment> + '_> {
        if self.0.is_empty() {
            self.0.lines()
        } else {
            let line_vertex_count = self.0.vertex_count();
            Box::new(self.0.lines().chain(std::iter::once(LineSegment {
                start: self.0.vertex_at(line_vertex_count - 1),
                end: self.0.vertex_at(0),
            })))
        }
    }

    fn vertices(&self) -> Box<dyn Iterator<Item = Vector> + '_> {
        self.0.vertices()
    }

    fn into_vertices(self) -> Vec<Vector> {
        self.0.vertices().collect()
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
