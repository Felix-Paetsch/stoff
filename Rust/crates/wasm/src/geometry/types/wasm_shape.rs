use wasm_bindgen::prelude::*;
use wasm_wrapper_derive::WASMWrapper;

use crate::{
    WASMWrapper,
    geometry::types::{WASMPolygon, WASMPolyline},
};
use geometry::{Shape, ShapeT};

#[wasm_bindgen]
#[derive(WASMWrapper)]
pub struct WASMShape(Shape);

#[wasm_bindgen]
impl WASMShape {
    pub fn is_polyline(&self) -> bool {
        self.inner().is_polyline()
    }

    pub fn is_polygon(&self) -> bool {
        self.inner().is_polygon()
    }

    pub fn from_polygon(p: WASMPolygon) -> WASMShape {
        WASMShape(Shape::Polygon(p.into_inner()))
    }

    pub fn from_polyline(p: WASMPolyline) -> WASMShape {
        WASMShape(Shape::Polyline(p.into_inner()))
    }

    pub fn into_polygon(self) -> Option<WASMPolygon> {
        match self.0 {
            Shape::Polygon(g) => Some(WASMPolygon::promote(g)),
            _ => None,
        }
    }

    pub fn into_polyline(self) -> Option<WASMPolyline> {
        match self.0 {
            Shape::Polyline(g) => Some(WASMPolyline::promote(g)),
            _ => None,
        }
    }
}
