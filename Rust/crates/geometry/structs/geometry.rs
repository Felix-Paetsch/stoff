use crate::geometry::*;

#[derive(Clone)]
pub enum Geometry {
    Point(Vector),
    Polyline(Polyline),
    Polygon(Polygon),
}
