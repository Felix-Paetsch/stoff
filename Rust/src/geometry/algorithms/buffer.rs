use geo::{Buffer, GeometryCollection, buffer::BufferStyle};

use crate::geometry::{Geometry, Polygon, Polyline, ShapeT};

#[allow(unused)]
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
            Polyline::from(exterior).into_polygon()
        })
        .collect()
}

pub enum LineJoin {
    Bevel,
    Miter(f64),
    Round(f64),
}

pub enum LineCap {
    Butt,
    Round(f64),
    Square,
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
            LineCap::Butt => geo::buffer::LineCap::Butt,
            LineCap::Square => geo::buffer::LineCap::Square,
        })
        .line_join(match join_style {
            LineJoin::Bevel => geo::buffer::LineJoin::Bevel,
            LineJoin::Miter(f) => geo::buffer::LineJoin::Miter(f),
            LineJoin::Round(f) => geo::buffer::LineJoin::Round(f),
        });

    GeometryCollection(geoms)
        .buffer_with_style(style)
        .0
        .into_iter()
        .map(|poly| {
            let (exterior, _) = poly.into_inner();
            Polyline::from(exterior).into_polygon()
        })
        .collect()
}
