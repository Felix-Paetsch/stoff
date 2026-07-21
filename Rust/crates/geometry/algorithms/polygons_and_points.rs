use geo::{
    Centroid, InteriorPoint,
    coordinate_position::{CoordPos, CoordinatePosition},
};

use crate::geometry::{Polygon, Vector, geo_compatibility::copy_shape_into_geo_polygon};

pub fn interior_point(polygon: &Polygon) -> Option<Vector> {
    let geogon = copy_shape_into_geo_polygon(polygon);
    let interior = geogon.interior_point();
    interior.map(Vector::from)
}

pub fn centroid(polygon: &Polygon) -> Option<Vector> {
    let geogon = copy_shape_into_geo_polygon(polygon);
    let centr = geogon.centroid();
    centr.map(Vector::from)
}

pub enum PointPosition {
    Outside,
    OnBoundry,
    Inside,
}

pub fn coordinate_position(polygon: &Polygon, vertex: Vector) -> PointPosition {
    let geogon = copy_shape_into_geo_polygon(polygon);
    let geocoord = geo::Coord::from(vertex);

    let pos = geogon.coordinate_position(&geocoord);
    match pos {
        CoordPos::Inside => PointPosition::Inside,
        CoordPos::OnBoundary => PointPosition::OnBoundry,
        CoordPos::Outside => PointPosition::Outside,
    }
}
