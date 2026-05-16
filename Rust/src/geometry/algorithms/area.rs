use geo::Area;
use wasm_bindgen::prelude::*;

use crate::geometry::{geometry::Geometry, polygon::Polygon, shape_trait::ShapeT};

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

#[wasm_bindgen]
pub fn wasm_geometry_polygon_area(coords: &[f64]) -> Option<f64> {
    let geom = Geometry::try_from(coords).ok()?;
    let res = match geom {
        Geometry::Point(_) => 0.0,
        Geometry::Polygon(gon) => gon.area(),
        Geometry::Polyline(ln) => ln.into_polygon().area(),
    };
    Some(res)
}

#[wasm_bindgen]
pub fn wasm_geometry_polygon_signed_area(coords: &[f64]) -> Option<f64> {
    let geom = Geometry::try_from(coords).ok()?;
    let res = match geom {
        Geometry::Point(_) => 0.0,
        Geometry::Polygon(gon) => gon.area(),
        Geometry::Polyline(ln) => ln.into_polygon().signed_area(),
    };
    Some(res)
}
