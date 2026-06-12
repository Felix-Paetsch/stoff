use wasm_bindgen::prelude::*;

use crate::grid::{
    algorithms::convolution::{
        convolve::ConvolutionKernel, test_separability::convolve_maybe_seperable,
    },
    grid_struct::Grid,
    wasm_compatibility::number_grid::WASMTransmittableNumberGrid,
};

#[wasm_bindgen]
pub struct WASMTransmittableConvolutionKernel {
    width: usize,
    height: usize,
    weights: Vec<f64>,
}

#[wasm_bindgen]
impl WASMTransmittableConvolutionKernel {
    pub fn new(
        width: usize,
        height: usize,
        values: Vec<f64>,
    ) -> WASMTransmittableConvolutionKernel {
        debug_assert_eq!(width * height, values.len());
        WASMTransmittableConvolutionKernel {
            width,
            height,
            weights: values,
        }
    }
}

impl From<WASMTransmittableConvolutionKernel> for ConvolutionKernel {
    fn from(value: WASMTransmittableConvolutionKernel) -> Self {
        ConvolutionKernel {
            width: value.width,
            height: value.height,
            weights: value.weights,
        }
    }
}

#[wasm_bindgen]
pub fn wasm_grid_convolve_f64(
    g: WASMTransmittableNumberGrid,
    k: WASMTransmittableConvolutionKernel,
) -> WASMTransmittableNumberGrid {
    let grid: Grid<f64> = g.into();
    convolve_maybe_seperable(&grid, &k.into()).into()
}
