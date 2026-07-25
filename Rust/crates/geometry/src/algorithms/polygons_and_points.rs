use geo::{
    Centroid, InteriorPoint,
    coordinate_position::{CoordPos, CoordinatePosition},
};

use crate::{Polygon, Vector, geo_compatibility::copy_shape_into_geo_polygon};

pub fn polygon_interior_point(polygon: &Polygon) -> Option<Vector> {
    let geogon = copy_shape_into_geo_polygon(polygon);
    let interior = geogon.interior_point();
    interior.map(Vector::from)
}

pub fn polygon_centroid(polygon: &Polygon) -> Option<Vector> {
    let geogon = copy_shape_into_geo_polygon(polygon);
    let centr = geogon.centroid();
    centr.map(Vector::from)
}

pub enum RelativePointPosition {
    Outside,
    OnBoundry,
    Inside,
}

pub fn polygon_relative_point_position(polygon: &Polygon, vertex: Vector) -> RelativePointPosition {
    let geogon = copy_shape_into_geo_polygon(polygon);
    let geocoord = geo::Coord::from(vertex);

    let pos = geogon.coordinate_position(&geocoord);
    match pos {
        CoordPos::Inside => RelativePointPosition::Inside,
        CoordPos::OnBoundary => RelativePointPosition::OnBoundry,
        CoordPos::Outside => RelativePointPosition::Outside,
    }
}
