import { GrayImage } from "ProcedualArt/primitives/image";
import { WASMGrayImage } from "Rust/exports";
import { Allocations } from "../index";

export function wasm_gray_image(i: GrayImage): WASMGrayImage {
    return Allocations.allocate(
        WASMGrayImage.new(i.dimensions[0], i.dimensions[1], i.pixels),
    );
}

export function gray_image_from_wasm(i: WASMGrayImage): GrayImage {
    const w = i.width();
    const h = i.height();

    return Allocations.consume(
        i,
        (i) => new GrayImage(i.into_pixels(), [w, h]),
    );
}
