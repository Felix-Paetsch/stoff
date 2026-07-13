use wasm_bindgen::prelude::*;

use crate::{
    geometry::{Matrix, Vector},
    grid::grid_struct::Grid,
    wasm::{
        WASMWrapper,
        grid::types::{
            wasm_float64_grid::WASMFloat64Grid, wasm_matrix_grid::WASMMatrixGrid,
            wasm_u8_grid::WASMU8Grid, wasm_vec3float64_grid::WASMVec3Float64Grid,
            wasm_vec3u8_grid::WASMVec3u8Grid, wasm_vector_grid::WASMVectorGrid,
        },
    },
};

pub enum WASMGridEnum {
    Float64(Grid<f64>),
    Vec3Float64(Grid<[f64; 3]>),
    Vec3U8(Grid<[u8; 3]>),
    U8(Grid<u8>),
    Vector(Grid<Vector>),
    Matrix(Grid<Matrix>),
}

#[wasm_bindgen]
pub struct WASMGrid(WASMGridEnum);

#[wasm_bindgen]
pub enum WASMGridType {
    Float64,
    Vec3Float64,
    Vec3U8,
    U8,
    Vector,
    Matrix,
}

#[wasm_bindgen]
impl WASMGrid {
    pub fn grid_type(&self) -> WASMGridType {
        match self.0 {
            WASMGridEnum::Float64(_) => WASMGridType::Float64,
            WASMGridEnum::Vec3Float64(_) => WASMGridType::Vec3Float64,
            WASMGridEnum::U8(_) => WASMGridType::U8,
            WASMGridEnum::Vec3U8(_) => WASMGridType::Vec3U8,
            WASMGridEnum::Vector(_) => WASMGridType::Vector,
            WASMGridEnum::Matrix(_) => WASMGridType::Matrix,
        }
    }

    pub fn domain_dimensions(&self) -> Vec<f64> {
        match &self.0 {
            WASMGridEnum::Float64(g) => g.domain_dimensions().into(),
            WASMGridEnum::Vec3Float64(g) => g.domain_dimensions().into(),
            WASMGridEnum::U8(g) => g.domain_dimensions().into(),
            WASMGridEnum::Vec3U8(g) => g.domain_dimensions().into(),
            WASMGridEnum::Vector(g) => g.domain_dimensions().into(),
            WASMGridEnum::Matrix(g) => g.domain_dimensions().into(),
        }
    }

    pub fn lattice_dimensions(&self) -> Vec<usize> {
        match &self.0 {
            WASMGridEnum::Float64(g) => g.lattice_dimensions().into(),
            WASMGridEnum::Vec3Float64(g) => g.lattice_dimensions().into(),
            WASMGridEnum::U8(g) => g.lattice_dimensions().into(),
            WASMGridEnum::Vec3U8(g) => g.lattice_dimensions().into(),
            WASMGridEnum::Vector(g) => g.lattice_dimensions().into(),
            WASMGridEnum::Matrix(g) => g.lattice_dimensions().into(),
        }
    }

    pub fn try_into_wasm_f64_grid(self) -> Option<WASMFloat64Grid> {
        self.try_into_f64_grid().map(WASMFloat64Grid::promote)
    }

    pub fn try_into_wasm_vec3f64_grid(self) -> Option<WASMVec3Float64Grid> {
        self.try_into_vec3f64_grid()
            .map(WASMVec3Float64Grid::promote)
    }

    pub fn try_into_wasm_u8_grid(self) -> Option<WASMU8Grid> {
        self.try_into_u8_grid().map(WASMU8Grid::promote)
    }

    pub fn try_into_wasm_vec3u8_grid(self) -> Option<WASMVec3u8Grid> {
        self.try_into_vec3u8_grid().map(WASMVec3u8Grid::promote)
    }

    pub fn try_into_wasm_vector_grid(self) -> Option<WASMVectorGrid> {
        self.try_into_vector_grid().map(WASMVectorGrid::promote)
    }

    pub fn try_into_wasm_matrix_grid(self) -> Option<WASMMatrixGrid> {
        self.try_into_matrix_grid().map(WASMMatrixGrid::promote)
    }
}

impl WASMGrid {
    pub fn inner(&self) -> &WASMGridEnum {
        &self.0
    }

    pub fn into_inner(self) -> WASMGridEnum {
        self.0
    }

    pub fn try_as_f64_grid(&self) -> Option<&Grid<f64>> {
        match &self.0 {
            WASMGridEnum::Float64(g) => Some(g),
            _ => None,
        }
    }

    pub fn try_as_f64_grid_mut(&mut self) -> Option<&mut Grid<f64>> {
        match &mut self.0 {
            WASMGridEnum::Float64(g) => Some(g),
            _ => None,
        }
    }

    pub fn try_into_f64_grid(self) -> Option<Grid<f64>> {
        match self.0 {
            WASMGridEnum::Float64(g) => Some(g),
            _ => None,
        }
    }

    pub fn try_as_vec3f64_grid(&self) -> Option<&Grid<[f64; 3]>> {
        match &self.0 {
            WASMGridEnum::Vec3Float64(g) => Some(g),
            _ => None,
        }
    }

    pub fn try_as_vec3f64_grid_mut(&mut self) -> Option<&mut Grid<[f64; 3]>> {
        match &mut self.0 {
            WASMGridEnum::Vec3Float64(g) => Some(g),
            _ => None,
        }
    }

    pub fn try_into_vec3f64_grid(self) -> Option<Grid<[f64; 3]>> {
        match self.0 {
            WASMGridEnum::Vec3Float64(g) => Some(g),
            _ => None,
        }
    }

    pub fn try_as_vec3u8_grid(&self) -> Option<&Grid<[u8; 3]>> {
        match &self.0 {
            WASMGridEnum::Vec3U8(g) => Some(g),
            _ => None,
        }
    }

    pub fn try_as_vec3u8_grid_mut(&mut self) -> Option<&mut Grid<[u8; 3]>> {
        match &mut self.0 {
            WASMGridEnum::Vec3U8(g) => Some(g),
            _ => None,
        }
    }

    pub fn try_into_vec3u8_grid(self) -> Option<Grid<[u8; 3]>> {
        match self.0 {
            WASMGridEnum::Vec3U8(g) => Some(g),
            _ => None,
        }
    }

    pub fn try_as_u8_grid(&self) -> Option<&Grid<u8>> {
        match &self.0 {
            WASMGridEnum::U8(g) => Some(g),
            _ => None,
        }
    }

    pub fn try_as_u8_grid_mut(&mut self) -> Option<&mut Grid<u8>> {
        match &mut self.0 {
            WASMGridEnum::U8(g) => Some(g),
            _ => None,
        }
    }

    pub fn try_into_u8_grid(self) -> Option<Grid<u8>> {
        match self.0 {
            WASMGridEnum::U8(g) => Some(g),
            _ => None,
        }
    }

    pub fn try_as_vector_grid(&self) -> Option<&Grid<Vector>> {
        match &self.0 {
            WASMGridEnum::Vector(g) => Some(g),
            _ => None,
        }
    }

    pub fn try_as_vector_grid_mut(&mut self) -> Option<&mut Grid<Vector>> {
        match &mut self.0 {
            WASMGridEnum::Vector(g) => Some(g),
            _ => None,
        }
    }

    pub fn try_into_vector_grid(self) -> Option<Grid<Vector>> {
        match self.0 {
            WASMGridEnum::Vector(g) => Some(g),
            _ => None,
        }
    }

    pub fn try_as_matrix_grid(&self) -> Option<&Grid<Matrix>> {
        match &self.0 {
            WASMGridEnum::Matrix(g) => Some(g),
            _ => None,
        }
    }

    pub fn try_as_matrix_grid_mut(&mut self) -> Option<&mut Grid<Matrix>> {
        match &mut self.0 {
            WASMGridEnum::Matrix(g) => Some(g),
            _ => None,
        }
    }

    pub fn try_into_matrix_grid(self) -> Option<Grid<Matrix>> {
        match self.0 {
            WASMGridEnum::Matrix(g) => Some(g),
            _ => None,
        }
    }

    pub fn promote_f64(g: Grid<f64>) -> WASMGrid {
        WASMGrid(WASMGridEnum::Float64(g))
    }

    pub fn promote_vec3f64(g: Grid<[f64; 3]>) -> WASMGrid {
        WASMGrid(WASMGridEnum::Vec3Float64(g))
    }

    pub fn promote_u8(g: Grid<u8>) -> WASMGrid {
        WASMGrid(WASMGridEnum::U8(g))
    }

    pub fn promote_vec3u8(g: Grid<[u8; 3]>) -> WASMGrid {
        WASMGrid(WASMGridEnum::Vec3U8(g))
    }

    pub fn promote_vector(g: Grid<Vector>) -> WASMGrid {
        WASMGrid(WASMGridEnum::Vector(g))
    }

    pub fn promote_matrix(g: Grid<Matrix>) -> WASMGrid {
        WASMGrid(WASMGridEnum::Matrix(g))
    }
}
