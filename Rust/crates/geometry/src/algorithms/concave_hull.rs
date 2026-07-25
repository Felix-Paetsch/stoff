use geo::{ConcaveHull, Coord, concave_hull::ConcaveHullOptions};

use crate::{
    Geometry, Polygon, ShapeT, Vector,
    geo_compatibility::{copy_shape_into_geo_linestring, copy_shape_into_geo_polygon},
};

pub fn concave_hull_with_options_vertices(
    vecs: &[Vector],
    concavity: f64,
    length_threshold: f64,
) -> Polygon {
    let pts: Vec<geo::Coord> = vecs.iter().map(|v| geo::Coord::from(*v)).collect();

    let poly = pts.concave_hull_with_options(ConcaveHullOptions {
        concavity,
        length_threshold,
    });

    Polygon::from(poly)
}

pub fn concave_hull_with_options_shape(
    shape: &impl ShapeT,
    concavity: f64,
    length_threshold: f64,
) -> Polygon {
    // TODO:
    // Eventually we could just copy the impl..
    let geo_poly = if shape.is_polyline() {
        let geopg: geo::LineString = copy_shape_into_geo_linestring(shape);
        geopg.concave_hull_with_options(ConcaveHullOptions {
            concavity,
            length_threshold,
        })
    } else {
        let geopg: geo::Polygon = copy_shape_into_geo_polygon(shape);
        geopg.concave_hull_with_options(ConcaveHullOptions {
            concavity,
            length_threshold,
        })
    };

    Polygon::from(geo_poly)
}

pub fn concave_hull_with_options_geometries(
    vecs: &[Geometry],
    concavity: f64,
    length_threshold: f64,
) -> Polygon {
    let lns: Vec<geo::LineString> = vecs
        .iter()
        .map(|g| match g {
            Geometry::Point(p) => geo::LineString::new(vec![Coord { x: p.x(), y: p.y() }]),
            Geometry::Polygon(g) => copy_shape_into_geo_linestring(g),
            Geometry::Polyline(l) => copy_shape_into_geo_linestring(l),
        })
        .collect();

    let mutliline = geo::MultiLineString(lns);

    let poly = mutliline.concave_hull_with_options(ConcaveHullOptions {
        concavity,
        length_threshold,
    });

    Polygon::from(poly)
}
