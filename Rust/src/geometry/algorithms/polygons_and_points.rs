use geo::{
    coordinate_position::{CoordPos, CoordinatePosition},
    Centroid, InteriorPoint,
};
use wasm_bindgen::prelude::*;

use crate::geometry::{geometry::Geometry, polygon::Polygon, vertex::Vertex};

pub fn interior_point(polygon: Polygon) -> Option<Vertex> {
    let geogon = geo::Polygon::from(polygon);
    let interior = geogon.interior_point();
    interior.map(Vertex::from)
}

pub fn centroid(polygon: Polygon) -> Option<Vertex> {
    let geogon = geo::Polygon::from(polygon);
    let centr = geogon.centroid();
    centr.map(Vertex::from)
}

pub enum PointPosition {
    Outside,
    OnBoundry,
    Inside,
}

pub fn coordinate_position(polygon: Polygon, vertex: Vertex) -> PointPosition {
    let geogon = geo::Polygon::from(polygon);
    let geocoord = geo::Coord::from(vertex);

    let pos = geogon.coordinate_position(&geocoord);
    match pos {
        CoordPos::Inside => PointPosition::Inside,
        CoordPos::OnBoundary => PointPosition::OnBoundry,
        CoordPos::Outside => PointPosition::Outside,
    }
}

#[wasm_bindgen]
pub fn wasm_geometry_interior_point(gon: &[f64]) -> Option<Vec<f64>> {
    let geom = Geometry::try_from(gon).ok()?;
    match geom {
        Geometry::Polygon(gon) => interior_point(gon).map(|p| Geometry::from(p).serialize()),
        _ => None,
    }
}

#[wasm_bindgen]
pub fn wasm_geometry_centroid(gon: &[f64]) -> Option<Vec<f64>> {
    let geom = Geometry::try_from(gon).ok()?;
    match geom {
        Geometry::Polygon(gon) => centroid(gon).map(|p| Geometry::from(p).serialize()),
        _ => None,
    }
}

#[wasm_bindgen]
pub fn wasm_geometry_coordiante_position(gon: &[f64], x: f64, y: f64) -> Option<i8> {
    let geom = Geometry::try_from(gon).ok()?;
    let vert = Vertex::new(x, y);

    match geom {
        Geometry::Polygon(gon) => match coordinate_position(gon, vert) {
            PointPosition::Outside => Some(-1),
            PointPosition::OnBoundry => Some(0),
            PointPosition::Inside => Some(1),
        },
        _ => None,
    }
}
