use crate::geometry::{
    geometry::Geometry, line_segment::LineSegment, polygon::Polygon, polyline::Polyline,
    vector::Vector,
};

pub trait ShapeT: Sized {
    fn lines(&self) -> Vec<LineSegment>;
    fn vertices(&self) -> &[Vector];
    fn into_vertices(self) -> Vec<Vector>;

    fn is_polyline(&self) -> bool;

    fn is_polygon(&self) -> bool {
        !self.is_polyline()
    }

    fn is_empty(&self) -> bool {
        self.vertices().len() == 0
    }

    fn into_polygon(self) -> Polygon {
        let mut verts: Vec<Vector> = self.into_vertices();
        if verts.last().unwrap() == verts.first().unwrap() && verts.len() > 3 {
            verts.pop();
        }
        Polygon(verts)
    }

    fn into_polyline(self) -> Polyline {
        match self.is_polyline() {
            true => Polyline(self.into_vertices()),
            false => {
                let mut verts: Vec<Vector> = self.into_vertices();
                if verts.len() == 0 {
                    return Polyline::empty();
                }

                verts.push(verts[0]);
                Polyline(verts)
            }
        }
    }

    fn into_geometry(self) -> Geometry {
        match self.is_polyline() {
            true => Geometry::Polyline(self.into_polyline()),
            false => Geometry::Polygon(self.into_polygon()),
        }
    }

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
