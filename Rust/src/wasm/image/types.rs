use image::GrayImage;
use wasm_bindgen::prelude::*;
use wasm_wrapper_derive::WASMWrapper;

#[wasm_bindgen]
#[derive(WASMWrapper)]
pub struct WASMGrayImage(GrayImage);
