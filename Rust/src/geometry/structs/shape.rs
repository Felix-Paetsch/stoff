pub use super::ShapeT;
use crate::geometry::{Geometry, LineSegment, Polygon, Polyline, Vector};

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
    fn lines(&self) -> Box<dyn Iterator<Item = LineSegment> + '_> {
        match self {
            Shape::Polyline(l) => l.lines(),
            Shape::Polygon(g) => g.lines(),
        }
    }

    fn vertices(&self) -> Box<dyn Iterator<Item = Vector> + '_> {
        match self {
            Shape::Polyline(l) => l.vertices(),
            Self::Polygon(g) => g.vertices(),
        }
    }

    fn vertices_from_to(&self, from: usize, to: usize) -> Box<dyn Iterator<Item = Vector> + '_> {
        match self {
            Shape::Polyline(l) => Box::new((from..to).map(|v| l.vertex_at(v))),
            Shape::Polygon(g) => Box::new((from..to).map(|v| g.vertex_at(v))),
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

    fn vertex_count(&self) -> usize {
        match self {
            Shape::Polyline(l) => l.vertex_count(),
            Self::Polygon(g) => g.vertex_count(),
        }
    }

    fn vertex_at(&self, at: usize) -> Vector {
        match self {
            Shape::Polyline(l) => l.vertex_at(at),
            Self::Polygon(g) => g.vertex_at(at),
        }
    }
}
