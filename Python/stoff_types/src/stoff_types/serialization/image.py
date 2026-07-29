from typing import TypedDict

import numpy as np

from ..types.image import GrayImage, RGBImage
from .number_array import destringify_u8_array, stringify_u8_array


class SerializedImageData(TypedDict):
    pixels: str
    dimensions: list[int]


class SerializedRGBImage(TypedDict):
    type: str
    data: SerializedImageData


class SerializedGrayImage(TypedDict):
    type: str
    data: SerializedImageData


def serialize_rgb_image(a: RGBImage) -> SerializedRGBImage:
    return {
        "type": "rgb_image",
        "data": {
            "pixels": stringify_u8_array(a.raw_data.tobytes()),
            "dimensions": list(a.dimensions),
        },
    }


def serialize_gray_image(a: GrayImage) -> SerializedGrayImage:
    return {
        "type": "gray_image",
        "data": {
            "pixels": stringify_u8_array(a.raw_data.tobytes()),
            "dimensions": list(a.dimensions),
        },
    }


def deserialize_rgb_image(value: SerializedRGBImage) -> RGBImage:
    dimensions = tuple(value["data"]["dimensions"])

    if len(dimensions) != 2:
        raise ValueError("Image dimensions must contain exactly two values")

    raw_data = np.frombuffer(
        destringify_u8_array(value["data"]["pixels"]),
        dtype=np.uint8,
    ).copy()

    return RGBImage(
        dimensions=(int(dimensions[0]), int(dimensions[1])),
        raw_data=raw_data,
    )


def deserialize_gray_image(value: SerializedGrayImage) -> GrayImage:
    dimensions = tuple(value["data"]["dimensions"])

    if len(dimensions) != 2:
        raise ValueError("Image dimensions must contain exactly two values")

    raw_data = np.frombuffer(
        destringify_u8_array(value["data"]["pixels"]),
        dtype=np.uint8,
    ).copy()

    return GrayImage(
        dimensions=(int(dimensions[0]), int(dimensions[1])),
        raw_data=raw_data,
    )
