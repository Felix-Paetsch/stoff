use clahe::clahe_u8_to_u8;
use image::io::Reader;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Load a grayscale image
    let input = Reader::open("input.png")?.decode()?.into_luma8();

    // Apply CLAHE
    // tiles_x: number of tiles horizontally
    // tiles_y: number of tiles vertically
    // clip_limit: contrast limiting (0 = no limiting, >0 = limiting)
    let output = clahe_u8_to_u8(
        8,   // 8 tiles across
        8,   // 8 tiles down
        2.0, // clip limit of 2.0 (typical value)
        &input,
    )?;

    // Save the result
    output.save("output.png")?;

    Ok(())
}
