use image::GrayImage;
use wasm_bindgen::prelude::*;
use wasm_wrapper_derive::WASMWrapper;

use crate::wasm::WASMWrapper;

#[wasm_bindgen]
#[derive(WASMWrapper)]
pub struct WASMGrayImage(GrayImage);

#[wasm_bindgen]
impl WASMGrayImage {
    pub fn new(width: u32, height: u32, pixels: Vec<u8>) -> WASMGrayImage {
        debug_assert_eq!(width * height, pixels.len() as u32);
        let gray_img = GrayImage::from_raw(width, height, pixels).unwrap();
        WASMGrayImage::promote(gray_img)
    }

    pub fn width(&self) -> u32 {
        self.inner().width()
    }

    pub fn height(&self) -> u32 {
        self.inner().height()
    }

    pub fn into_pixels(self) -> Vec<u8> {
        self.into_inner().into_raw()
    }
}
