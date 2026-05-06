use geo::ConvexHull;
use wasm_bindgen::prelude::*;

use crate::geometry::{
    geometry::Geometry, geometry_compatability_layer::vecf64_to_vertex_vec, polygon::Polygon,
    vertex::Vertex,
};

pub fn convex_hull(of: Vec<Vertex>) -> Polygon {
    let gon = Polygon::new(of);
    let geo_gon = geo::Polygon::from(gon);
    let hull = geo_gon.convex_hull();
    Polygon::from(hull)
}

#[wasm_bindgen]
pub fn wasm_geometry_convex_hull(of: &[f64]) -> Option<Vec<f64>> {
    let vecs = vecf64_to_vertex_vec(of)?;
    let hull = convex_hull(vecs);
    let hull_geom = Geometry::from(hull);
    Some(hull_geom.serialize())
}
