from __future__ import annotations

from dataclasses import dataclass
from typing import TypeAlias

import numpy as np

ImageDimensions: TypeAlias = tuple[int, int]


@dataclass
class RGBImage:
    dimensions: ImageDimensions
    raw_data: np.ndarray

    def __post_init__(self) -> None:
        width, height = self.dimensions

        if width <= 0 or height <= 0:
            raise ValueError("Image dimensions must both be greater than 0")

        if self.raw_data.ndim != 1:
            raise ValueError("raw_data must be a one-dimensional array")

        if self.raw_data.dtype != np.uint8:
            raise TypeError("raw_data must have dtype numpy.uint8")

        expected_size = width * height * 3

        if self.raw_data.size != expected_size:
            raise ValueError("RGB raw_data size must equal width * height * 3")


@dataclass
class GrayImage:
    dimensions: ImageDimensions
    raw_data: np.ndarray

    def __post_init__(self) -> None:
        width, height = self.dimensions

        if width <= 0 or height <= 0:
            raise ValueError("Image dimensions must both be greater than 0")

        if self.raw_data.ndim != 1:
            raise ValueError("raw_data must be a one-dimensional array")

        if self.raw_data.dtype != np.uint8:
            raise TypeError("raw_data must have dtype numpy.uint8")

        expected_size = width * height

        if self.raw_data.size != expected_size:
            raise ValueError("Gray raw_data size must equal width * height")
