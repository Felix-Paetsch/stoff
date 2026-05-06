use geo::{concave_hull::ConcaveHullOptions, ConcaveHull};
use wasm_bindgen::prelude::*;

use crate::geometry::{
    geometry::Geometry, geometry_compatability_layer::vecf64_to_vertex_vec, polygon::Polygon,
    polyline::Polyline, shape::Shape, vertex::Vertex,
};

pub fn concave_hull_with_options_vertices(
    vecs: &[Vertex],
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
    shape: Shape,
    concavity: f64,
    length_threshold: f64,
) -> Polygon {
    let geo_poly = match shape {
        Shape::Polygon(pg) => {
            let geopg: geo::Polygon = pg.into();
            geopg.concave_hull_with_options(ConcaveHullOptions {
                concavity,
                length_threshold,
            })
        }
        Shape::Polyline(pl) => {
            let geopl: geo::LineString = pl.into();
            geopl.concave_hull_with_options(ConcaveHullOptions {
                concavity,
                length_threshold,
            })
        }
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
        .map(|v| match v {
            Geometry::Point(p) => {
                let coord: geo::Coord = (*p).into();
                geo::LineString(vec![coord, coord])
            }
            Geometry::Polyline(l) => l.clone().into(),
            Geometry::Polygon(g) => {
                let line: Polyline = g.clone().into();
                line.into()
            }
        })
        .collect();

    let mutliline = geo::MultiLineString(lns);

    let poly = mutliline.concave_hull_with_options(ConcaveHullOptions {
        concavity,
        length_threshold,
    });

    Polygon::from(poly)
}

#[wasm_bindgen]
pub fn wasm_geometry_concave_hull_vertices(
    coords: &[f64],
    concavity: f64,
    length_threshold: f64,
) -> Option<Vec<f64>> {
    let vertices = vecf64_to_vertex_vec(coords)?;
    let gon = concave_hull_with_options_vertices(&vertices, concavity, length_threshold);
    let geom = Geometry::from(gon);
    Some(geom.serialize())
}

#[wasm_bindgen]
pub fn wasm_geometry_concave_hull_shape(
    coords: &[f64],
    concavity: f64,
    length_threshold: f64,
) -> Option<Vec<f64>> {
    let shape = Geometry::deserialize(coords)?;
    let gon = match shape {
        Geometry::Point(p) => Polygon::new(vec![p]),
        _ => {
            let s = Shape::from_geometry(shape).unwrap();
            concave_hull_with_options_shape(s, concavity, length_threshold)
        }
    };

    let geom = Geometry::from(gon);
    Some(geom.serialize())
}

#[wasm_bindgen]
pub fn wasm_geometry_concave_hull_geometries(
    coords: &[f64],
    concavity: f64,
    length_threshold: f64,
) -> Option<Vec<f64>> {
    let geometries = Geometry::vecf64_to_geometry_vec(coords)?;
    let gon = concave_hull_with_options_geometries(&geometries, concavity, length_threshold);

    let geom = Geometry::from(gon);
    Some(geom.serialize())
}
