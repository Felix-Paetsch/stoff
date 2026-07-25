use clahe::clahe_u8_to_u8;
use image::GrayImage;

pub fn gray_image_clahe(
    input: &GrayImage,
    tiles_across: usize,
    tiles_down: usize,
    clip_limit: f32,
) -> GrayImage {
    clahe_u8_to_u8(tiles_across, tiles_down, clip_limit, input)
}
