use geo::Area;

use crate::geometry::*;

impl Polygon {
    pub fn area(&self) -> f64 {
        let polygon: geo::Polygon = Polygon::into(self.clone());
        polygon.unsigned_area()
    }

    pub fn signed_area(&self) -> f64 {
        let polygon: geo::Polygon = Polygon::into(self.clone());
        -polygon.signed_area()
    }
}
