import { GrayImage } from "Core/image/image_types/grayscale";
import { wasm_image_clahe, WASMCompatability } from "Rust/exports";

export function clahe(
    i: GrayImage,
    tiles_across: number = 8,
    tiles_down: number = 8,
    clip_limit: number = 0.2,
): GrayImage {
    const serialized = WASMCompatability.Grid.serialize_u8_grid(g);
    const res = wasm_image_clahe(
        serialized,
        tiles_across,
        tiles_down,
        clip_limit,
    );
    return WASMCompatability.Grid.deserialize_u8_grid(res);
}
