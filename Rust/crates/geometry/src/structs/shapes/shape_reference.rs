use crate::{Geometry, Shape, Vector};

pub use super::ShapeT;

pub enum ShapeReference<'a> {
    Polyline(&'a [Vector]),
    Polygon(&'a [Vector]),
}

impl<'a> ShapeReference<'a> {
    pub fn from_geometry(geom: Geometry) -> Option<Shape> {
        match geom {
            Geometry::Point(_) => None,
            Geometry::Polygon(g) => Some(Shape::Polygon(g)),
            Geometry::Polyline(l) => Some(Shape::Polyline(l)),
        }
    }
}

impl<'a> ShapeT for ShapeReference<'a> {
    fn vertices(&self) -> &[Vector] {
        match self {
            ShapeReference::Polyline(l) => l,
            ShapeReference::Polygon(g) => g,
        }
    }

    fn into_vertices(self) -> Vec<Vector> {
        self.vertices().to_vec()
    }

    fn is_polyline(&self) -> bool {
        matches!(self, ShapeReference::Polyline(_))
    }
}
