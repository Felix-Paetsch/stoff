use image::GrayImage;

use crate::grid::{grid_struct::Grid, wasm_compatibility::u8_grid::WASMTransmittableU8Grid};

impl From<GrayImage> for Grid<u8> {
    fn from(value: GrayImage) -> Self {
        let dim = value.dimensions();
        Grid::new(
            [0.0, 0.0, dim.0 as f64 - 1.0, dim.1 as f64 - 1.0],
            [dim.0 as usize, dim.1 as usize],
            value.into_raw(),
        )
    }
}

impl From<Grid<u8>> for GrayImage {
    fn from(value: Grid<u8>) -> Self {
        let [width, height] = value.lattice_dimensions();
        let data = value.into_values();

        GrayImage::from_raw(width as u32, height as u32, data)
            .expect("Failed to create GrayImage from grid data")
    }
}

impl From<GrayImage> for WASMTransmittableU8Grid {
    fn from(value: GrayImage) -> Self {
        let temp: Grid<u8> = value.into();
        temp.into()
    }
}

impl From<WASMTransmittableU8Grid> for GrayImage {
    fn from(value: WASMTransmittableU8Grid) -> Self {
        let temp: Grid<u8> = value.into();
        temp.into()
    }
}
