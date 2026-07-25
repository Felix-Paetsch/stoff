use wasm_bindgen::prelude::*;

use crate::{
    WASMWrapper,
    geometry::types::{WASMGeometry, WASMGeometryCollection, WASMPolygon, WASMVectorVec},
};

use geometry::{
    Geometry, Polygon, concave_hull_with_options_geometries, concave_hull_with_options_shape,
    concave_hull_with_options_vertices,
};

#[wasm_bindgen]
pub fn wasm_geometry_concave_hull_vertices(
    verts: &WASMVectorVec,
    concavity: f64,
    length_threshold: f64,
) -> WASMPolygon {
    let gon = concave_hull_with_options_vertices(verts.inner(), concavity, length_threshold);
    gon.into()
}

#[wasm_bindgen]
pub fn wasm_geometry_concave_hull_shape(
    geom: &WASMGeometry,
    concavity: f64,
    length_threshold: f64,
) -> WASMPolygon {
    WASMPolygon::promote(match &geom.inner() {
        Geometry::Point(p) => Polygon::new(vec![*p]),
        Geometry::Polyline(l) => concave_hull_with_options_shape(l, concavity, length_threshold),
        Geometry::Polygon(g) => concave_hull_with_options_shape(g, concavity, length_threshold),
    })
}

#[wasm_bindgen]
pub fn wasm_geometry_concave_hull_geometries(
    geoms: &WASMGeometryCollection,
    concavity: f64,
    length_threshold: f64,
) -> WASMPolygon {
    let reff: &Vec<_> = geoms.into();
    concave_hull_with_options_geometries(reff, concavity, length_threshold).into()
}
