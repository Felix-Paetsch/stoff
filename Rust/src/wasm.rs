use wasm_bindgen::prelude::*;

#[wasm_bindgen(start)]
pub fn main() {
    std::panic::set_hook(Box::new(console_error_panic_hook::hook));
}

mod wasm_wrapper;
pub use wasm_wrapper::*;

mod geometry;
mod graph;
mod grid;
mod image;

mod advanced;
