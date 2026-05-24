use crate::geometry::{Geometry, LineSegment, Polygon, Polyline, Shape, Vector};

pub trait ShapeT: Sized {
    fn lines(&self) -> Box<dyn Iterator<Item = LineSegment> + '_>;

    fn vertices(&self) -> &[Vector];
    fn into_vertices(self) -> Vec<Vector>;

    fn is_polyline(&self) -> bool;

    fn is_polygon(&self) -> bool {
        !self.is_polyline()
    }

    fn is_empty(&self) -> bool {
        self.vertices().len() == 0
    }

    fn linesegment_at(&self, at: usize) -> Option<LineSegment> {
        if at < self.vertices().len() - 1 {
            Some(LineSegment {
                start: self.vertices()[at],
                end: self.vertices()[at + 1],
            })
        } else if at == self.vertices().len() - 1 && self.is_polygon() {
            Some(LineSegment {
                start: self.vertices()[at],
                end: self.vertices()[0],
            })
        } else {
            None
        }
    }

    fn vertex_count(&self) -> usize {
        self.vertices().len()
    }

    fn linesegment_count(&self) -> usize {
        if self.is_empty() {
            return 0;
        }

        if self.is_polyline() {
            self.vertex_count() - 1
        } else {
            self.vertex_count()
        }
    }

    fn into_polygon(self) -> Polygon {
        let mut verts: Vec<Vector> = self.into_vertices();
        if verts.last().unwrap() == verts.first().unwrap() && verts.len() > 2 {
            verts.pop();
        }
        Polygon::new(verts)
    }

    fn into_polyline(self) -> Polyline {
        match self.is_polyline() {
            true => Polyline::new(self.into_vertices()),
            false => {
                let mut verts: Vec<Vector> = self.into_vertices();
                if verts.is_empty() {
                    return Polyline::empty();
                }

                verts.push(verts[0]);
                Polyline::new(verts)
            }
        }
    }

    #[allow(unused)]
    fn into_shape(self) -> Shape {
        match self.is_polyline() {
            true => Shape::Polyline(self.into_polyline()),
            false => Shape::Polygon(self.into_polygon()),
        }
    }

    #[allow(dead_code)]
    fn into_geometry(self) -> Geometry {
        match self.is_polyline() {
            true => Geometry::Polyline(self.into_polyline()),
            false => Geometry::Polygon(self.into_polygon()),
        }
    }

    #[allow(dead_code)]
    fn into_geo_polygon(self) -> geo::Polygon {
        self.into_polygon().into()
    }

    fn into_geo_linestring(self) -> geo::LineString {
        self.into_polyline().into()
    }

    fn length(&self) -> f64 {
        let mut current_len = 0.0;
        for ls in self.lines() {
            current_len += ls.end.distance(ls.start)
        }
        current_len
    }
}
