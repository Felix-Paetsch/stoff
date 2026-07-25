use crate::{Polygon, Polyline, Vector};

#[derive(Clone)]
pub enum Geometry {
    Point(Vector),
    Polyline(Polyline),
    Polygon(Polygon),
}
