use geometry::{BufferLineCapStyle, BufferLineJoinStyle, Shape, buffer_geometries_with_style};
use wasm_bindgen::prelude::*;

use crate::{
    WASMWrapper,
    geometry::{WASMGeometryCollection, WASMShapeCollection},
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
        0 => BufferLineJoinStyle::Round(join_value),
        1 => BufferLineJoinStyle::Bevel,
        2 => BufferLineJoinStyle::Miter(join_value),
        _ => unreachable!(),
    };

    let cap_style = match cap_style {
        0 => BufferLineCapStyle::Round(cap_value),
        1 => BufferLineCapStyle::Butt,
        2 => BufferLineCapStyle::Square,
        _ => unreachable!(),
    };

    let buffered: Vec<Shape> =
        buffer_geometries_with_style(geometries.inner(), distance, join_style, cap_style)
            .into_iter()
            .map(Shape::Polygon)
            .collect();

    WASMShapeCollection::promote(buffered)
}
