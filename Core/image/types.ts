export { GrayImage } from "./image_types/grayscale";
export { RGBImage } from "./image_types/rgb";

import { GrayImage } from "./image_types/grayscale";
import { RGBImage } from "./image_types/rgb";

export type Image = GrayImage | RGBImage;

export function is_image(a: unknown): a is Image {
    return a instanceof GrayImage || a instanceof RGBImage;
}
