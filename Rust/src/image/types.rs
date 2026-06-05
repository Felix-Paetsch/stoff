use image::GrayImage;

use crate::grid::grid_struct::Grid;

impl From<GrayImage> for Grid<f64> {
    fn from(value: GrayImage) -> Self {
        let dim = value.dimensions();
        Grid::new(
            [0.0, 0.0, dim.0 as f64 - 1.0, dim.1 as f64 - 1.0],
            [dim.0 as usize, dim.1 as usize],
            value.into_raw().into_iter().map(|v| v as f64).collect(),
        )
    }
}

impl From<Grid<f64>> for GrayImage {
    fn from(value: Grid<f64>) -> Self {
        let dims = value.lattice_dimensions();
        let values = value.into_values();
        let u8_vals = values.into_iter().map(|v| v.round() )
    }
}
