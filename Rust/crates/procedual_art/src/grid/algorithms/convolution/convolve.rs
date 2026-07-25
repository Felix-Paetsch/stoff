use std::ops::{Add, Mul};

use itertools::Itertools;

use crate::grid::grid_struct::Grid;

pub struct ConvolutionKernel {
    pub width: usize,
    pub height: usize,
    pub weights: Vec<f64>,
}

impl ConvolutionKernel {
    #[inline]
    pub fn get(&self, pos: [usize; 2]) -> f64 {
        self.weights[self.width * pos[1] + pos[0]]
    }
}

pub fn convolve<T>(g: &Grid<T>, k: &ConvolutionKernel) -> Grid<T>
where
    T: Add<Output = T> + Mul<f64, Output = T> + Default + Copy,
{
    g.map_windows(k.width, k.height, |w| {
        let mut res: T = T::default();
        let squares_it = (0..k.width).cartesian_product(0..k.height);
        for (i, j) in squares_it {
            res = (res + *w.get([i, j])) * k.get([i, j]);
        }

        res
    })
}
