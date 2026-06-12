use itertools::Itertools;

use crate::{grid::grid_struct::Grid, numerics::vector_space::RVectorSpace};

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
    T: RVectorSpace,
{
    g.map_windows(k.width, k.height, |w| {
        let mut res: T = T::zero();
        let squares_it = (0..k.width).cartesian_product(0..k.height);
        for (i, j) in squares_it {
            res = res.add(&w.get([i, j]).scale(k.get([i, j])));
        }

        res.scale(1.0 / (k.width * k.height) as f64)
    })
}
