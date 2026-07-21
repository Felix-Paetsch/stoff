use crate::{grid::grid_struct::Grid, numerics::vector_space::RVectorSpace};

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
}

pub fn convolve_separable<T>(g: &Grid<T>, k: &SeparableConvolutionKernel) -> Grid<T>
where
    T: RVectorSpace,
{
    let ker_width = k.weights_x.len();
    let ker_height = k.weights_y.len();

    g.map_windows(ker_width, 1, |w| {
        let mut res: T = T::zero();
        for i in 0..ker_width {
            res = res.add(&w.get([i, 0]).scale(k.weights_x[i]));
        }

        res
    })
    .map_windows(1, ker_height, |w| {
        let mut res: T = T::zero();
        for i in 0..ker_height {
            res = res.add(&w.get([0, i]).scale(k.weights_y[i]));
        }

        res
    })
}
