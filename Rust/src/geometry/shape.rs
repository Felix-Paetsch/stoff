use crate::geometry::{
    geometry::Geometry, line_segment::LineSegment, polygon::Polygon, polyline::Polyline,
    vertex::Vertex,
};

pub enum Shape {
    Polyline(Polyline),
    Polygon(Polygon),
}

impl Shape {
    pub fn lines(&self) -> Box<dyn Iterator<Item = LineSegment> + '_> {
        match self {
            Shape::Polyline(l) => Box::new(l.lines()),
            Shape::Polygon(g) => Box::new(g.lines()),
        }
    }

    pub fn verticies(&self) -> Box<dyn Iterator<Item = &Vertex> + '_> {
        match self {
            Shape::Polyline(l) => Box::new(l.0.iter()),
            Shape::Polygon(g) => Box::new(g.0.iter()),
        }
    }

    pub fn into_verticies(self) -> Vec<Vertex> {
        match self {
            Shape::Polyline(l) => l.0,
            Shape::Polygon(g) => g.0,
        }
    }

    pub fn from_geometry(geom: Geometry) -> Option<Shape> {
        match geom {
            Geometry::Point(_) => None,
            Geometry::Polygon(g) => Some(Shape::Polygon(g)),
            Geometry::Polyline(l) => Some(Shape::Polyline(l)),
        }
    }
}

impl From<Shape> for Geometry {
    fn from(s: Shape) -> Geometry {
        match s {
            Shape::Polygon(g) => Geometry::Polygon(g),
            Shape::Polyline(l) => Geometry::Polyline(l),
        }
    }
}

impl From<Shape> for Polyline {
    fn from(s: Shape) -> Polyline {
        match s {
            Shape::Polygon(g) => Polyline::from(g),
            Shape::Polyline(l) => l,
        }
    }
}

impl From<Shape> for Polygon {
    fn from(s: Shape) -> Polygon {
        match s {
            Shape::Polygon(g) => g,
            Shape::Polyline(l) => Polygon::from(l),
        }
    }
}
