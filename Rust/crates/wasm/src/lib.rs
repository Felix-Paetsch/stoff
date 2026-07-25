use wasm_bindgen::prelude::*;

#[wasm_bindgen(start)]
pub fn main() {
    console_error_panic_hook::set_once();
    console_log::init_with_level(log::Level::Debug).expect("failed to initialize logger");
}

mod wasm_wrapper;
pub use wasm_wrapper::*;

pub mod geometry;
pub mod procedual_art;
