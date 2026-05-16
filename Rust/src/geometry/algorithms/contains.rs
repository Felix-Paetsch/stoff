use geo::{Contains, ContainsProperly};
use wasm_bindgen::prelude::*;

use crate::geometry::{geometry_enum::Geometry, polygon::Polygon};

pub fn polygon_contains_geometry(polygon: Polygon, geom: Geometry) -> bool {
    let geogon: geo::Polygon = polygon.into();
    let geogeom: geo::Geometry = geom.into();

    geogon.contains(&geogeom)
}

pub fn polygon_contains_geometry_properly(polygon: Polygon, geom: Geometry) -> bool {
    let geogon: geo::Polygon = polygon.into();
    let geogeom: geo::Geometry = geom.into();

    geogon.contains_properly(&geogeom)
}

#[wasm_bindgen]
pub fn wasm_geometry_polygon_contains_geometry(polygon: &[f64], geometry: &[f64]) -> bool {
    let gon = Geometry::from(polygon);
    let geom = Geometry::from(geometry);

    match gon {
        Geometry::Polygon(gon) => polygon_contains_geometry(gon, geom),
        _ => unreachable!(),
    }
}

#[wasm_bindgen]
pub fn wasm_geometry_polygon_contains_geometry_properly(
    polygon: &[f64],
    geometry: &[f64],
) -> Option<bool> {
    let gon = Geometry::try_from(polygon).ok()?;
    let geom = Geometry::try_from(geometry).ok()?;

    match gon {
        Geometry::Polygon(gon) => Some(polygon_contains_geometry_properly(gon, geom)),
        _ => None,
    }
}
