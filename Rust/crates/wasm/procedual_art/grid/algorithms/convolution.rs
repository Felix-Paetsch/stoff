use wasm_bindgen::prelude::*;

use crate::{
    grid::algorithms::convolution::{
        convolve::ConvolutionKernel, test_kernel_separability::convolve_maybe_seperable,
    },
    wasm::grid::types::wasm_grid::{WASMGrid, WASMGridEnum},
};

#[wasm_bindgen]
pub struct WASMConvolutionKernel {
    width: usize,
    height: usize,
    weights: Vec<f64>,
}

#[wasm_bindgen]
impl WASMConvolutionKernel {
    pub fn new(width: usize, height: usize, values: Vec<f64>) -> WASMConvolutionKernel {
        debug_assert_eq!(width * height, values.len());
        WASMConvolutionKernel {
            width,
            height,
            weights: values,
        }
    }
}

impl From<WASMConvolutionKernel> for ConvolutionKernel {
    fn from(value: WASMConvolutionKernel) -> Self {
        ConvolutionKernel {
            width: value.width,
            height: value.height,
            weights: value.weights,
        }
    }
}

#[wasm_bindgen]
pub fn wasm_grid_convolve(g: &WASMGrid, k: WASMConvolutionKernel) -> WASMGrid {
    match g.inner() {
        WASMGridEnum::Float64(g) => WASMGrid::promote_f64(convolve_maybe_seperable(g, &k.into())),
        WASMGridEnum::Vec3Float64(g) => {
            WASMGrid::promote_vec3f64(convolve_maybe_seperable(g, &k.into()))
        }
        WASMGridEnum::U8(g) => WASMGrid::promote_f64(convolve_maybe_seperable(
            &g.map(|_, a| *a as f64),
            &k.into(),
        )),
        WASMGridEnum::Vec3U8(g) => WASMGrid::promote_vec3f64(convolve_maybe_seperable(
            &g.map(|_, a| [a[0] as f64, a[1] as f64, a[2] as f64]),
            &k.into(),
        )),
        WASMGridEnum::Vector(g) => WASMGrid::promote_vector(convolve_maybe_seperable(g, &k.into())),
        WASMGridEnum::Matrix(g) => WASMGrid::promote_matrix(convolve_maybe_seperable(g, &k.into())),
        WASMGridEnum::Boolean(g) => {
            let float_grid = g.map(|_, a| if *a { 1.0 } else { 0.0 });
            let convolved = convolve_maybe_seperable(&float_grid, &k.into());
            let res = convolved.map(|_, a| a.abs() < 0.5);
            WASMGrid::promote_bool(res)
        }
    }
}
