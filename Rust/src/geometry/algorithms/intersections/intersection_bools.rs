use wasm_bindgen::prelude::*;

use geo::{Intersects, Validation};

use crate::geometry::{geometry::Geometry, shape::Shape};

pub fn intersects(l1: Geometry, l2: Geometry) -> bool {
    let geogeom1: geo::Geometry = l1.into();
    let geogeom2: geo::Geometry = l2.into();
    geogeom1.intersects(&geogeom2)
}

pub fn self_intersects(s: Shape) -> bool {
    match s {
        Shape::Polygon(p) => {
            let geogon: geo::Polygon = p.into();
            geogon.is_valid()
        }
        Shape::Polyline(l) => {
            let geoline: geo::LineString = l.into();
            geoline.is_valid()
        }
    }
}

#[wasm_bindgen]
pub fn wasm_geometry_geometries_intersect(geo1: &[f64], geo2: &[f64]) -> Option<bool> {
    let geom1 = Geometry::deserialize(geo1)?;
    let geom2 = Geometry::deserialize(geo2)?;
    Some(intersects(geom1, geom2))
}

#[wasm_bindgen]
pub fn wasm_geometry_shape_selfintersects(s: &[f64]) -> Option<bool> {
    let geom = Geometry::deserialize(s)?;
    let shape = Shape::from_geometry(geom)?;
    Some(self_intersects(shape))
}
