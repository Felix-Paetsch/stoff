use crate::geometry::{
    geometry_enum::Geometry, line_segment::LineSegment, polygon::Polygon, polyline::Polyline,
    shape_trait::ShapeT, vector::Vector,
};

pub enum Shape {
    Polyline(Polyline),
    Polygon(Polygon),
}

impl Shape {
    pub fn from_geometry(geom: Geometry) -> Option<Shape> {
        match geom {
            Geometry::Point(_) => None,
            Geometry::Polygon(g) => Some(Shape::Polygon(g)),
            Geometry::Polyline(l) => Some(Shape::Polyline(l)),
        }
    }
}

impl ShapeT for Shape {
    fn lines(&self) -> Vec<LineSegment> {
        match self {
            Shape::Polyline(l) => l.lines(),
            Shape::Polygon(g) => g.lines(),
        }
    }

    fn vertices(&self) -> &[Vector] {
        match self {
            Shape::Polyline(l) => l.vertices(),
            Self::Polygon(g) => g.vertices(),
        }
    }

    fn into_vertices(self) -> Vec<Vector> {
        match self {
            Shape::Polyline(l) => l.into_vertices(),
            Self::Polygon(g) => g.into_vertices(),
        }
    }

    fn is_polyline(&self) -> bool {
        match self {
            Shape::Polyline(_) => true,
            Self::Polygon(_) => false,
        }
    }
}
