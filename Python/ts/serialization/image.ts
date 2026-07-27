import { Json } from "@/Core/utils";
import { GrayImage, RGBImage } from "@/ProcArt/image";
import { destringify_u8_array, stringify_u8_array } from "./number_array";

export function serialize_rgb_image(a: RGBImage): {
    type: "rgb_image";
    data: Json;
} {
    return {
        type: "rgb_image",
        data: {
            pixels: stringify_u8_array(a.pixels),
            dimensions: a.dimensions
        }
    };
}

export function serialize_gray_image(a: GrayImage): {
    type: "gray_image";
    data: Json;
} {
    return {
        type: "gray_image",
        data: {
            pixels: stringify_u8_array(a.pixels),
            dimensions: a.dimensions
        }
    };
}

export function deserialize_rgb_image(value: {
    type: "rgb_image";
    data: any;
}): RGBImage {
    return new RGBImage(
        destringify_u8_array(value.data.pixels),
        value.data.dimensions as [number, number]
    );
}

export function deserialize_gray_image(value: {
    type: "gray_image";
    data: any;
}): GrayImage {
    return new GrayImage(
        destringify_u8_array(value.data.pixels),
        value.data.dimensions as [number, number]
    );
}
