use wasm_bindgen::prelude::*;

use clahe::clahe_u8_to_u8;
use image::GrayImage;

use crate::grid::wasm_compatibility::u8_grid::WASMTransmittableU8Grid;

pub fn clahe(
    input: &GrayImage,
    tiles_across: usize,
    tiles_down: usize,
    clip_limit: f32,
) -> GrayImage {
    clahe_u8_to_u8(tiles_across, tiles_down, clip_limit, input).expect("Valid input")
}

#[wasm_bindgen]
pub fn wasm_image_clahe(
    input: WASMTransmittableU8Grid,
    tiles_across: usize,
    tiles_down: usize,
    clip_limit: f32,
) -> WASMTransmittableU8Grid {
    let gray_img: GrayImage = input.into();
    clahe(&gray_img, tiles_across, tiles_down, clip_limit).into()
}
