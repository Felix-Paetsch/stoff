use geo::Winding;
use wasm_bindgen::prelude::*;

use crate::geometry::{
    geometry::Geometry, polygon::Polygon, polyline::Polyline, shape_trait::ShapeT,
};

pub enum WindingOrder {
    Clockwise,
    CounterClockwise,
}

pub fn winding_order(gon: Polygon) -> Option<WindingOrder> {
    let geoline: geo::LineString = gon.into_geo_linestring();

    match geoline.winding_order() {
        None => None,
        Some(geo::winding_order::WindingOrder::Clockwise) => Some(WindingOrder::Clockwise),
        Some(geo::winding_order::WindingOrder::CounterClockwise) => {
            Some(WindingOrder::CounterClockwise)
        }
    }
}

#[wasm_bindgen]
pub fn wasm_geometry_winding_order(gon: &[f64]) -> Option<i8> {
    let geom = Geometry::deserialize(gon)?;
    match geom {
        Geometry::Polygon(gon) => winding_order(gon).map(|order| match order {
            WindingOrder::Clockwise => 1,
            WindingOrder::CounterClockwise => 0,
        }),
        _ => None,
    }
}
