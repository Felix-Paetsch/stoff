import { GrayImage } from "ProcedualArt/primitives/image/image_types/grayscale";
import { wasm_image_clahe, WASMCompatability } from "Rust/exports";

export function clahe(
    i: GrayImage,
    tiles_across: number = 8,
    tiles_down: number = 8,
    clip_limit: number = 0.2,
): GrayImage {
    const wasm = WASMCompatability.Image.wasm_gray_image(i);
    const res = WASMCompatability.Allocations.free_after_use(wasm, (w) =>
        WASMCompatability.Allocations.allocate(
            wasm_image_clahe(w, tiles_across, tiles_down, clip_limit),
        ),
    );
    return WASMCompatability.Image.gray_image_from_wasm(res);
}
