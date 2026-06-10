use crate::{grid::grid_struct::Grid, numerics::vector_space::RVectorSpace};

pub struct Kernel {
    width: u8,
    height: u8,
    weights: Vec<f64>,
}

pub fn convolve<T>(g: &Grid<T>, k: &Kernel) -> Grid<T>
where
    T: RVectorSpace,
{
    todo!();
}
