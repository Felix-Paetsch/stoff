use geo::{Contains, ContainsProperly};

use crate::{
    Geometry, Polygon,
    geo_compatibility::{copy_geometry_into_geo_geometry, copy_shape_into_geo_polygon},
};

pub fn polygon_contains_geometry(polygon: &Polygon, geom: &Geometry) -> bool {
    let geogon: geo::Polygon = copy_shape_into_geo_polygon(polygon);
    let geogeom: geo::Geometry = copy_geometry_into_geo_geometry(geom);

    geogon.contains(&geogeom)
}

pub fn polygon_contains_geometry_properly(polygon: &Polygon, geom: &Geometry) -> bool {
    let geogon: geo::Polygon = copy_shape_into_geo_polygon(polygon);
    let geogeom: geo::Geometry = copy_geometry_into_geo_geometry(geom);

    geogon.contains_properly(&geogeom)
}
