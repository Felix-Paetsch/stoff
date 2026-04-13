from __future__ import annotations

from pathlib import Path
from typing import Iterable

import numpy as np
from PIL import Image


def load_image(path: str | Path) -> Image.Image:
    """
    Load an image file into a Pillow image in RGBA mode.
    """
    return Image.open(path).convert("RGBA")


def rgba_to_rgb_array(image: Image.Image) -> np.ndarray:
    """
    Convert an RGBA image to an RGB numpy array composited on a white background.
    This avoids alpha-only differences causing odd comparisons.
    """
    if image.mode != "RGBA":
        image = image.convert("RGBA")

    background = Image.new("RGBA", image.size, (255, 255, 255, 255))
    composited = Image.alpha_composite(background, image).convert("RGB")
    return np.asarray(composited, dtype=np.float32)


def resize_to_common_size(
    img_a: Image.Image, img_b: Image.Image, size: tuple[int, int] = (256, 256)
) -> tuple[np.ndarray, np.ndarray]:
    """
    Resize both images to a common size and return RGB float arrays.
    """
    img_a = img_a.resize(size, Image.Resampling.LANCZOS)
    img_b = img_b.resize(size, Image.Resampling.LANCZOS)
    return rgba_to_rgb_array(img_a), rgba_to_rgb_array(img_b)


def to_grayscale_array(
    path_a: str | Path,
    path_b: str | Path,
    size: tuple[int, int] = (256, 256),
) -> tuple[np.ndarray, np.ndarray]:
    """
    Load two images, convert them to grayscale, resize them to a common size,
    and return them as numpy arrays.
    """
    img_a = load_image(path_a).convert("L").resize(size, Image.Resampling.LANCZOS)
    img_b = load_image(path_b).convert("L").resize(size, Image.Resampling.LANCZOS)

    return (
        np.asarray(img_a, dtype=np.float64),
        np.asarray(img_b, dtype=np.float64),
    )


def pairwise(items: list[Path]) -> Iterable[tuple[Path, Path]]:
    """
    Yield all unique unordered pairs from a list of paths.
    """
    for i in range(len(items)):
        for j in range(i + 1, len(items)):
            yield items[i], items[j]
