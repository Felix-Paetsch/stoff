use geo::Area;

use crate::{Polygon, geo_compatibility::copy_shape_into_geo_polygon};

pub fn polygon_area(g: &Polygon) -> f64 {
    let polygon: geo::Polygon = copy_shape_into_geo_polygon(g);
    polygon.unsigned_area()
}

pub fn polygon_signed_area(g: &Polygon) -> f64 {
    let polygon: geo::Polygon = copy_shape_into_geo_polygon(g);
    -polygon.signed_area()
}
