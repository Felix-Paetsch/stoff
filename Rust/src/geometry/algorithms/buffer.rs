use geo::{buffer::BufferStyle, Buffer, GeometryCollection};
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

pub enum LineJoin {
    Bevel(),
    Miter(f64),
    Round(f64),
}

pub enum LineCap {
    Butt(),
    Round(f64),
    Square(),
}

pub fn buffer_geometries_with_style(
    geometries: &[Geometry],
    distance: f64,
    join_style: LineJoin,
    cap_style: LineCap,
) -> Vec<Polygon> {
    let geoms: Vec<geo::Geometry> = geometries
        .iter()
        .map(|geometry| match geometry {
            Geometry::Point(point) => geo::Point::from(*point).into(),
            Geometry::Polygon(polygon) => geo::Polygon::from(polygon.clone()).into(),
            Geometry::Polyline(polyline) => geo::LineString::from(polyline.clone()).into(),
        })
        .collect();

    let style = BufferStyle::new(distance)
        .line_cap(match cap_style {
            LineCap::Round(f) => geo::buffer::LineCap::Round(f),
            LineCap::Butt() => geo::buffer::LineCap::Butt,
            LineCap::Square() => geo::buffer::LineCap::Square,
        })
        .line_join(match join_style {
            LineJoin::Bevel() => geo::buffer::LineJoin::Bevel,
            LineJoin::Miter(f) => geo::buffer::LineJoin::Miter(f),
            LineJoin::Round(f) => geo::buffer::LineJoin::Round(f),
        });

    GeometryCollection(geoms)
        .buffer_with_style(style)
        .0
        .into_iter()
        .map(|poly| {
            let (exterior, _) = poly.into_inner();
            Polygon::from(Polyline::from(exterior))
        })
        .collect()
}

#[wasm_bindgen]
pub fn wasm_geometry_buffer_geometries_with_style(
    geometries: &[f64],
    distance: f64,
    join_style: u8,
    join_value: f64,
    cap_style: u8,
    cap_value: f64,
) -> Option<Vec<f64>> {
    let shapes = Geometry::vecf64_to_geometry_vec(geometries)?;
    let join_style = match join_style {
        0 => LineJoin::Round(join_value),
        1 => LineJoin::Bevel(),
        2 => LineJoin::Miter(join_value),
        _ => unreachable!(),
    };

    let cap_style = match cap_style {
        0 => LineCap::Round(cap_value),
        1 => LineCap::Butt(),
        2 => LineCap::Square(),
        _ => unreachable!(),
    };

    let buffered: Vec<Geometry> =
        buffer_geometries_with_style(&shapes, distance, join_style, cap_style)
            .into_iter()
            .map(Geometry::from)
            .collect();

    Some(Geometry::geometry_vec_to_vecf64(&buffered))
}
