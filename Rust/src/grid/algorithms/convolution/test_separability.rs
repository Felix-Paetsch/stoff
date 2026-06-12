use crate::{
    grid::{
        algorithms::convolution::{
            convolve::{convolve, ConvolutionKernel},
            convolve_separable::{convolve_separable, SeparableConvolutionKernel},
        },
        grid_struct::Grid,
    },
    numerics::{eps::EPS_ABS, vector_space::RVectorSpace},
};
use nalgebra::{DMatrix, DVector};

impl From<&ConvolutionKernel> for DMatrix<f64> {
    fn from(kernel: &ConvolutionKernel) -> Self {
        DMatrix::from_row_slice(kernel.height, kernel.width, &kernel.weights)
    }
}

pub fn test_separability(
    k: &ConvolutionKernel,
    tolerance: f64,
) -> Option<SeparableConvolutionKernel> {
    let mat: DMatrix<f64> = k.into();

    let (rows, cols) = mat.shape();
    for i in 0..rows {
        for j in 0..cols {
            let pivot = k.get([i, j]);
            if pivot.abs() > tolerance {
                let x: DVector<f64> = mat.row(i).transpose();
                let y: DVector<f64> = mat.column(j) / pivot;

                let reconstructed: DMatrix<f64> = &y * x.transpose();
                if (mat - reconstructed).abs().max() < tolerance {
                    let x_vec: Vec<f64> = x.into_owned().data.into();
                    let y_vec: Vec<f64> = y.into_owned().data.into();

                    return Some(SeparableConvolutionKernel::new(x_vec, y_vec));
                }
                return None;
            }
        }
    }

    None
}

pub fn convolve_maybe_seperable<T>(g: &Grid<T>, k: &ConvolutionKernel) -> Grid<T>
where
    T: RVectorSpace,
{
    if let Some(sep_kernel) = test_separability(k, EPS_ABS) {
        convolve_separable(g, &sep_kernel)
    } else {
        convolve(g, k)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::grid::algorithms::convolution::convolve::ConvolutionKernel;

    fn kernel(width: usize, height: usize, weights: Vec<f64>) -> ConvolutionKernel {
        ConvolutionKernel {
            width,
            height,
            weights,
        }
    }

    #[test]
    fn test_inseparable_kernel() {
        let k = kernel(
            3,
            3,
            vec![
                1.0, 0.0, 1.0, //
                0.0, 1.0, 0.0, //
                1.0, 0.0, 1.0,
            ],
        );

        let result = test_separability(&k, 1e-10);
        assert!(result.is_none());
    }

    #[test]
    fn test_box_blur_3x4_kernel() {
        let k = kernel(
            3,
            4,
            vec![
                1.0, 1.0, 1.0, //
                1.0, 1.0, 1.0, //
                1.0, 1.0, 1.0, //
                1.0, 1.0, 1.0,
            ],
        );

        let result = test_separability(&k, 1e-10);
        assert!(result.is_some());

        let sep = result.unwrap();

        assert_eq!(sep.weights_x.len(), 3);
        assert_eq!(sep.weights_y.len(), 4);

        assert_eq!(sep.weights_x, vec![1.0, 1.0, 1.0]);
        assert_eq!(sep.weights_y, vec![1.0, 1.0, 1.0, 1.0]);
    }

    #[test]
    fn test_gaussian_3x3_kernel() {
        let k = kernel(
            3,
            3,
            vec![
                1.0, 2.0, 1.0, //
                2.0, 4.0, 2.0, //
                1.0, 2.0, 1.0,
            ],
        );

        let result = test_separability(&k, 1e-10);
        assert!(result.is_some());

        let sep = result.unwrap();

        assert_eq!(sep.weights_x.len(), 3);
        assert_eq!(sep.weights_y.len(), 3);

        assert_eq!(sep.weights_x, vec![1.0, 2.0, 1.0]);
        assert_eq!(sep.weights_y, vec![1.0, 2.0, 1.0]);
    }
}
