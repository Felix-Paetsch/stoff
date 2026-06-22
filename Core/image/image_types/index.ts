export * from "./grayscale";
export * from "./rgb";

import { GrayImage } from "./grayscale";
import { RGBImage } from "./rgb";

export type Image = GrayImage | RGBImage;

export function is_image(a: unknown): a is Image {
    return a instanceof GrayImage || a instanceof RGBImage;
}
