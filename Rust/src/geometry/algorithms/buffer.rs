use geo::{Buffer, GeometryCollection};
use wasm_bindgen::prelude::*;

use crate::geometry::{geometry::Geometry, polygon::Polygon, polyline::Polyline};

pub fn buffer_geometries(geometries: &[Geometry], distance: f64) -> Vec<Polygon> {
    let geoms: Vec<geo::Geometry> = geometries
        .iter()
        .map(|geometry| match geometry {
            Geometry::Point(point) => geo::Point::from(*point).into(),
            Geometry::Polygon(polygon) => geo::Polygon::from(polygon.clone()).into(),
            Geometry::Polyline(polyline) => geo::LineString::from(polyline.clone()).into(),
        })
        .collect();

    GeometryCollection(geoms)
        .buffer(distance)
        .0
        .into_iter()
        .map(|poly| {
            let (exterior, _) = poly.into_inner();
            Polygon::from(Polyline::from(exterior))
        })
        .collect()
}

#[wasm_bindgen]
pub fn wasm_geometry_buffer_geometries(geometries: &[f64], distance: f64) -> Option<Vec<f64>> {
    let shapes = Geometry::vecf64_to_geometry_vec(geometries)?;
    let buffered: Vec<Geometry> = buffer_geometries(&shapes, distance)
        .into_iter()
        .map(Geometry::from)
        .collect();

    Some(Geometry::geometry_vec_to_vecf64(&buffered))
}
