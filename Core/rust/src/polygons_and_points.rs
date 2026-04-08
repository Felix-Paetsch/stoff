use crate::utils::vecf64_to_linestring;
use geo::coordinate_position::{CoordPos, CoordinatePosition};
use geo::{Centroid, InteriorPoint, Point, Polygon, coord};
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn interior_point(polygon: &[f64]) -> Option<Vec<f64>> {
    let ls = vecf64_to_linestring(polygon).unwrap();
    let polygon = Polygon::new(ls, vec![]);

    polygon.interior_point().map(|c: Point| vec![c.x(), c.y()])
}

#[wasm_bindgen]
pub fn centroid(polygon: &[f64]) -> Option<Vec<f64>> {
    let ls = vecf64_to_linestring(polygon).unwrap();
    let polygon = Polygon::new(ls, vec![]);

    polygon.centroid().map(|c: Point| vec![c.x(), c.y()])
}

#[wasm_bindgen]
pub fn coordinate_position(polygon: &[f64], x: f64, y: f64) -> i8 {
    // -1 outside, 0 border, 1 inside

    let ls = vecf64_to_linestring(polygon).unwrap();
    let polygon = Polygon::new(ls, vec![]);
    let coord = coord! { x: x, y: y };

    let pos = polygon.coordinate_position(&coord);
    match pos {
        CoordPos::Outside => -1,
        CoordPos::OnBoundary => 0,
        CoordPos::Inside => 1,
    }
}
