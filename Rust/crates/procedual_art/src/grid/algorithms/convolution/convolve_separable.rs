use std::ops::{Add, Mul};

use crate::grid::{convolution::ConvolutionKernel, grid_struct::Grid};

pub struct SeparableConvolutionKernel {
    pub weights_x: Vec<f64>,
    pub weights_y: Vec<f64>,
}

impl SeparableConvolutionKernel {
    pub fn new(weights_x: Vec<f64>, weights_y: Vec<f64>) -> SeparableConvolutionKernel {
        assert!(!weights_x.is_empty());
        assert!(!weights_y.is_empty());

        SeparableConvolutionKernel {
            weights_x,
            weights_y,
        }
    }

    pub fn kernel(&self) -> ConvolutionKernel {
        let width = self.weights_x.len();
        let height = self.weights_y.len();

        let mut weights = Vec::with_capacity(width * height);

        for y in 0..height {
            for x in 0..width {
                weights.push(self.weights_x[x] * self.weights_y[y]);
            }
        }

        ConvolutionKernel {
            width,
            height,
            weights,
        }
    }
}

pub fn convolve_separable<T>(g: &Grid<T>, k: &SeparableConvolutionKernel) -> Grid<T>
where
    T: Add<Output = T> + Mul<f64, Output = T> + Default + Copy,
{
    let ker_width = k.weights_x.len();
    let ker_height = k.weights_y.len();

    g.map_windows(ker_width, 1, |w| {
        let mut res: T = T::default();
        for i in 0..ker_width {
            res = (res + *w.get([i, 0])) * k.weights_x[i];
        }

        res
    })
    .map_windows(1, ker_height, |w| {
        let mut res: T = T::default();
        for i in 0..ker_height {
            res = (res + *w.get([0, i])) * k.weights_y[i];
        }

        res
    })
}
