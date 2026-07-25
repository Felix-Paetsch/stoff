use geo::{Buffer, GeometryCollection, buffer::BufferStyle};

use crate::{
    Geometry, Polygon, Polyline, ShapeT, geo_compatibility::copy_geometry_into_geo_geometry,
};

pub fn buffer_geometries(geometries: &[Geometry], distance: f64) -> Vec<Polygon> {
    let geoms: Vec<geo::Geometry> = geometries
        .iter()
        .map(copy_geometry_into_geo_geometry)
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

pub enum BufferLineJoinStyle {
    Bevel,
    Miter(f64),
    Round(f64),
}

pub enum BufferLineCapStyle {
    Butt,
    Round(f64),
    Square,
}

pub fn buffer_geometries_with_style(
    geometries: &[Geometry],
    distance: f64,
    join_style: BufferLineJoinStyle,
    cap_style: BufferLineCapStyle,
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
            BufferLineCapStyle::Round(f) => geo::buffer::LineCap::Round(f),
            BufferLineCapStyle::Butt => geo::buffer::LineCap::Butt,
            BufferLineCapStyle::Square => geo::buffer::LineCap::Square,
        })
        .line_join(match join_style {
            BufferLineJoinStyle::Bevel => geo::buffer::LineJoin::Bevel,
            BufferLineJoinStyle::Miter(f) => geo::buffer::LineJoin::Miter(f),
            BufferLineJoinStyle::Round(f) => geo::buffer::LineJoin::Round(f),
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
