use wasm_bindgen::prelude::*;

use crate::geometry::{
    algorithms::intersections::modify_polyline_intersections::index::{
        walk_polyline_with_intersections, walk_polyline_without_intersections,
    },
    geometry::Geometry,
    shape::Shape,
    shape_trait::ShapeT,
};

#[wasm_bindgen]
pub fn wasm_geometry_walk_shape_without_self_intersection(geom: &[f64]) -> Option<Vec<f64>> {
    let geom = Geometry::deserialize(geom)?;
    let shape = Shape::from_geometry(geom)?;

    let shape_was_polyline = shape.is_polygon();
    let pl = shape.into_polyline();
    let walk = walk_polyline_without_intersections(&pl);

    let res = if shape_was_polyline {
        Geometry::from(walk)
    } else {
        Geometry::from(walk.into_polygon())
    };
    Some(res.serialize())
}

#[wasm_bindgen]
pub fn wasm_geometry_walk_shape_with_self_intersection(geom: &[f64]) -> Option<Vec<f64>> {
    let geom = Geometry::deserialize(geom)?;
    let shape = Shape::from_geometry(geom)?;

    let shape_was_polyline = shape.is_polygon();
    let pl = shape.into_polyline();
    let walk = walk_polyline_with_intersections(&pl);

    let res = if shape_was_polyline {
        Geometry::from(walk)
    } else {
        Geometry::from(walk.into_polygon())
    };
    Some(res.serialize())
}
