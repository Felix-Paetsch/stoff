use wasm_bindgen::prelude::*;

use crate::geometry::{
    algorithms::closest_shape_positions::{
        closest_point_position_on_shape, closest_shape_positions,
    },
    geometry::Geometry,
    shape::Shape,
    vector::Vector,
};

#[wasm_bindgen]
pub fn wasm_geometry_closest_point_position_on_shape(
    point_x: f64,
    point_y: f64,
    shape: &[f64],
) -> Option<Vec<f64>> {
    let point = Vector::new(point_x, point_y);

    let geom = Geometry::try_from(shape).ok()?;
    let shape = Shape::from_geometry(geom)?;

    let res = closest_point_position_on_shape(point, &shape);
    Some(vec![
        res.vec.x,
        res.vec.y,
        res.start_index as f64,
        res.fraction,
    ])
}

#[wasm_bindgen]
pub fn wasm_geometry_closest_shape_positions(shape1: &[f64], shape2: &[f64]) -> Option<Vec<f64>> {
    let geom1 = Geometry::try_from(shape1).ok()?;
    let shape1 = Shape::from_geometry(geom1)?;

    let geom2 = Geometry::try_from(shape2).ok()?;
    let shape2 = Shape::from_geometry(geom2)?;

    let res = closest_shape_positions(&shape1, &shape2);
    Some(vec![
        res[0].vec.x,
        res[0].vec.y,
        res[0].start_index as f64,
        res[0].fraction,
        res[1].vec.x,
        res[1].vec.y,
        res[1].start_index as f64,
        res[1].fraction,
    ])
}
