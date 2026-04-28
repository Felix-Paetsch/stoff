use crate::utils::{vecf64_to_generalized_line, GeneralizedLine};
use geo::coordinate_position::{CoordPos, CoordinatePosition};
use geo::{coord, Centroid, InteriorPoint, Point, Polygon};
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn interior_point(polygon: &[f64]) -> Option<Vec<f64>> {
    let gl = vecf64_to_generalized_line(polygon);

    match gl {
        GeneralizedLine::Polyline(ls) => {
            let polygon = Polygon::new(ls, vec![]);
            polygon.interior_point().map(|c: Point| vec![c.x(), c.y()])
        }
        _ => None,
    }
}

#[wasm_bindgen]
pub fn centroid(polygon: &[f64]) -> Option<Vec<f64>> {
    let gl = vecf64_to_generalized_line(polygon);

    match gl {
        GeneralizedLine::Polyline(ls) => {
            let polygon = Polygon::new(ls, vec![]);
            polygon.centroid().map(|c: Point| vec![c.x(), c.y()])
        }
        GeneralizedLine::Point(p) => Some(vec![p.x(), p.y()]),
        _ => None,
    }
}

#[wasm_bindgen]
pub fn coordinate_position(polygon: &[f64], x: f64, y: f64) -> i8 {
    // -1 outside, 0 border, 1 inside

    let coord = coord! { x: x, y: y };
    let gl = vecf64_to_generalized_line(polygon);

    match gl {
        GeneralizedLine::Polyline(ls) => {
            let polygon = Polygon::new(ls, vec![]);

            let pos = polygon.coordinate_position(&coord);
            match pos {
                CoordPos::Outside => -1,
                CoordPos::OnBoundary => 0,
                CoordPos::Inside => 1,
            }
        }
        GeneralizedLine::Point(p) => {
            if p.0.eq(&coord) {
                0
            } else {
                -1
            }
        }
        _ => -1,
    }
}
