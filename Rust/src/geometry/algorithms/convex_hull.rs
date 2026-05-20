use geo::ConvexHull;
use wasm_bindgen::prelude::*;

use crate::geometry::{wasm_compatability::vecf64_to_vertex_vec, Geometry, Polygon, Vector};

pub fn convex_hull(of: Vec<Vector>) -> Polygon {
    let gon = Polygon::new(of);
    let geo_gon = geo::Polygon::from(gon);
    let hull = geo_gon.convex_hull();
    Polygon::from(hull)
}

#[wasm_bindgen]
pub fn wasm_geometry_convex_hull(of: &[f64]) -> Vec<f64> {
    let vecs = vecf64_to_vertex_vec(of);
    let hull = convex_hull(vecs);
    let hull_geom = Geometry::from(hull);
    hull_geom.serialize()
}
