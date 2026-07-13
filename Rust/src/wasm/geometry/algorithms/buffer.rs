use wasm_bindgen::prelude::*;

use crate::{
    geometry::{
        Shape,
        algorithms::buffer::{LineCap, LineJoin, buffer_geometries_with_style},
    },
    wasm::{
        WASMWrapper,
        geometry::types::{WASMGeometryCollection, WASMShapeCollection},
    },
};

#[wasm_bindgen]
pub fn wasm_geometry_buffer_geometries_with_style(
    geometries: &WASMGeometryCollection,
    distance: f64,
    join_style: u8,
    join_value: f64,
    cap_style: u8,
    cap_value: f64,
) -> WASMShapeCollection {
    let join_style = match join_style {
        0 => LineJoin::Round(join_value),
        1 => LineJoin::Bevel,
        2 => LineJoin::Miter(join_value),
        _ => unreachable!(),
    };

    let cap_style = match cap_style {
        0 => LineCap::Round(cap_value),
        1 => LineCap::Butt,
        2 => LineCap::Square,
        _ => unreachable!(),
    };

    let buffered: Vec<Shape> =
        buffer_geometries_with_style(geometries.inner(), distance, join_style, cap_style)
            .into_iter()
            .map(Shape::Polygon)
            .collect();

    WASMShapeCollection::promote(buffered)
}
