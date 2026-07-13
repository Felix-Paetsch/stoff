use wasm_bindgen::prelude::*;
use wasm_wrapper_derive::WASMWrapper;

use crate::{
    geometry::{Geometry, ShapeT, Vector},
    wasm::{
        WASMWrapper,
        geometry::types::{WASMPolygon, WASMPolyline, WASMShape, WASMVector},
    },
};

#[wasm_bindgen]
#[derive(WASMWrapper)]
pub struct WASMGeometry(Geometry);

#[wasm_bindgen]
pub enum WASMGeometryType {
    Vector,
    Polygon,
    Polyline,
}

#[wasm_bindgen]
impl WASMGeometry {
    pub fn from_vector_xy(x: f64, y: f64) -> WASMGeometry {
        WASMGeometry(Geometry::Point(Vector::new(x, y)))
    }

    pub fn from_vector(v: WASMVector) -> WASMGeometry {
        WASMGeometry(Geometry::Point(v.into_inner()))
    }

    pub fn from_shape(v: WASMShape) -> WASMGeometry {
        if v.is_polyline() {
            WASMGeometry(Geometry::Polyline(v.into_inner().into_polyline()))
        } else {
            WASMGeometry(Geometry::Polygon(v.into_inner().into_polygon()))
        }
    }

    pub fn from_polygon(g: WASMPolygon) -> WASMGeometry {
        WASMGeometry(Geometry::Polygon(g.into_inner()))
    }

    pub fn from_polyline(l: WASMPolyline) -> WASMGeometry {
        WASMGeometry(Geometry::Polyline(l.into_inner()))
    }

    pub fn geometry_type(&self) -> WASMGeometryType {
        match self.0 {
            Geometry::Point(_) => WASMGeometryType::Vector,
            Geometry::Polygon(_) => WASMGeometryType::Polygon,
            Geometry::Polyline(_) => WASMGeometryType::Polyline,
        }
    }

    pub fn into_vector(self) -> Option<WASMVector> {
        match self.0 {
            Geometry::Point(v) => Some(WASMVector::promote(v)),
            _ => None,
        }
    }

    pub fn into_polygon(self) -> Option<WASMPolygon> {
        match self.0 {
            Geometry::Polygon(g) => Some(WASMPolygon::promote(g)),
            _ => None,
        }
    }

    pub fn into_polyline(self) -> Option<WASMPolyline> {
        match self.0 {
            Geometry::Polyline(g) => Some(WASMPolyline::promote(g)),
            _ => None,
        }
    }
}
