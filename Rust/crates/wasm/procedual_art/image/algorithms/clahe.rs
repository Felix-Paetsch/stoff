use wasm_bindgen::prelude::*;

use crate::{
    image::algorithms::gray_image_clahe::gray_image_clahe,
    wasm::{WASMWrapper, image::types::WASMGrayImage},
};

#[wasm_bindgen]
pub fn wasm_image_clahe(
    input: &WASMGrayImage,
    tiles_across: usize,
    tiles_down: usize,
    clip_limit: f32,
) -> WASMGrayImage {
    WASMGrayImage::promote(gray_image_clahe(
        input.inner(),
        tiles_across,
        tiles_down,
        clip_limit,
    ))
}
