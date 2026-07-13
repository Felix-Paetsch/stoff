use geo::{Contains, ContainsProperly};

use crate::geometry::{Geometry, Polygon};

// TODO: No clone (note we actually clone twice)
// - clone_to_geo

pub fn polygon_contains_geometry(polygon: &Polygon, geom: &Geometry) -> bool {
    let geogon: geo::Polygon = polygon.clone().into();
    let geogeom: geo::Geometry = geom.clone().into();

    geogon.contains(&geogeom)
}

pub fn polygon_contains_geometry_properly(polygon: &Polygon, geom: &Geometry) -> bool {
    let geogon: geo::Polygon = polygon.clone().into();
    let geogeom: geo::Geometry = geom.clone().into();

    geogon.contains_properly(&geogeom)
}
