from __future__ import annotations
from pathlib import Path
import numpy as np
try:
    from .tools import (
        load_image,
        pairwise,
        resize_to_common_size,
        to_grayscale_array,
    )
except ImportError:
    from tools import (
        load_image,
        pairwise,
        resize_to_common_size,
        to_grayscale_array,
    )

SIMILARITY_THRESHOLDS = [
    ("ssim", 0.2),
    ("mse", 0.995),
    ("mae", 0.995),
    ("histogram", 0.998),
]

def image_similarity(
    path_a: str | Path,
    path_b: str | Path,
    thresholds: list[tuple[str, float]] | None = None,
) -> bool:
    """
    Check if two images are similar enough across multiple metrics.

    Returns True iff the images meet or exceed the similarity threshold
    for ALL specified metrics.

    Args:
        path_a: Path to first image
        path_b: Path to second image
        thresholds: List of (metric_name, min_threshold) tuples.
                   If None, uses SIMILARITY_THRESHOLDS.

    Returns:
        True if all metric thresholds are met, False otherwise.
    """
    if thresholds is None:
        thresholds = SIMILARITY_THRESHOLDS

    for metric_name, threshold in thresholds:
        if metric_name == "ssim":
            score = similarity_ssim(path_a, path_b)
        elif metric_name == "mse":
            score = similarity_mse(path_a, path_b)
        elif metric_name == "mae":
            score = similarity_mae(path_a, path_b)
        elif metric_name == "histogram":
            score = similarity_histogram(path_a, path_b)
        else:
            raise ValueError(f"Unknown metric: {metric_name}")

        if score < threshold:
            return False

    return True

def similarity_mse(path_a: str | Path, path_b: str | Path) -> float:
    """
    Similarity based on mean squared error.

    Returns a value in [0, 1], where:
    - 1.0 means identical after normalization/resizing
    - 0.0 means maximally different under this metric
    """
    img_a = load_image(path_a)
    img_b = load_image(path_b)
    arr_a, arr_b = resize_to_common_size(img_a, img_b)

    mse = np.mean((arr_a - arr_b) ** 2)
    max_mse = 255.0**2
    similarity = 1.0 - (mse / max_mse)
    return float(np.clip(similarity, 0.0, 1.0))


def similarity_mae(path_a: str | Path, path_b: str | Path) -> float:
    """
    Similarity based on mean absolute error.
    """
    img_a = load_image(path_a)
    img_b = load_image(path_b)
    arr_a, arr_b = resize_to_common_size(img_a, img_b)

    mae = np.mean(np.abs(arr_a - arr_b))
    max_mae = 255.0
    similarity = 1.0 - (mae / max_mae)
    return float(np.clip(similarity, 0.0, 1.0))


def similarity_histogram(
    path_a: str | Path, path_b: str | Path, bins: int = 32
) -> float:
    """
    Compare images by RGB color histograms.

    This is more tolerant to small shifts/layout differences,
    but less sensitive to exact structure.
    """
    img_a = load_image(path_a)
    img_b = load_image(path_b)
    arr_a, arr_b = resize_to_common_size(img_a, img_b)

    hist_parts_a = []
    hist_parts_b = []

    for channel in range(3):
        hist_a, _ = np.histogram(
            arr_a[:, :, channel], bins=bins, range=(0, 256), density=True
        )
        hist_b, _ = np.histogram(
            arr_b[:, :, channel], bins=bins, range=(0, 256), density=True
        )
        hist_parts_a.append(hist_a)
        hist_parts_b.append(hist_b)

    hist_a = np.concatenate(hist_parts_a)
    hist_b = np.concatenate(hist_parts_b)

    intersection = np.minimum(hist_a, hist_b).sum()
    denom = max(hist_a.sum(), hist_b.sum(), 1e-12)
    similarity = intersection / denom
    return float(np.clip(similarity, 0.0, 1.0))


def similarity_ssim(path_a: str | Path, path_b: str | Path) -> float:
    """
    Structural similarity (global SSIM-style approximation).

    This is usually a better perceptual metric than raw MSE/MAE.

    Note:
    This is a simplified global SSIM implementation rather than a
    full sliding-window SSIM, but it still measures luminance,
    contrast, and structure in a principled way and returns [0, 1].
    """
    x, y = to_grayscale_array(path_a, path_b)

    mu_x = x.mean()
    mu_y = y.mean()

    sigma_x2 = ((x - mu_x) ** 2).mean()
    sigma_y2 = ((y - mu_y) ** 2).mean()
    sigma_xy = ((x - mu_x) * (y - mu_y)).mean()

    l = 255.0
    c1 = (0.01 * l) ** 2
    c2 = (0.03 * l) ** 2

    numerator = (2 * mu_x * mu_y + c1) * (2 * sigma_xy + c2)
    denominator = (mu_x**2 + mu_y**2 + c1) * (sigma_x2 + sigma_y2 + c2)

    if denominator == 0:
        return 1.0

    ssim = numerator / denominator
    return float(np.clip(ssim, 0.0, 1.0))


def print_similarity_report(path_a: str | Path, path_b: str | Path) -> None:
    """
    Print all similarity measures for a pair of images.
    """
    print("\nComparing:")
    print(f"  A: {path_a}")
    print(f"  B: {path_b}")

    print(f"  similarity_ssim:                  {similarity_ssim(path_a, path_b):.4f}")
    print(f"  similarity_mse:                   {similarity_mse(path_a, path_b):.4f}")
    print(f"  similarity_mae:                   {similarity_mae(path_a, path_b):.4f}")
    print(
        f"  similarity_histogram:             "
        f"{similarity_histogram(path_a, path_b):.4f}"
    )
    print(f"  Images are similar?: {image_similarity(path_a, path_b)}")


if __name__ == "__main__":
    # Put paths to test image files here, relative to this Python file.
    TEST_IMAGES = [
        "../test_output/sin/out_0.png",
        "../test_output/sin/out_1.png",
    ]

    base_dir = Path(__file__).resolve().parent
    image_paths = [base_dir / rel_path for rel_path in TEST_IMAGES]

    missing = [p for p in image_paths if not p.exists()]
    if missing:
        print("These test files do not exist:")
        for path in missing:
            print(f"  {path}")
    elif len(image_paths) < 2:
        print("Please provide at least two image paths in TEST_IMAGES.")
    else:
        print("Thresholds:", SIMILARITY_THRESHOLDS)
        for path_a, path_b in pairwise(image_paths):
            print_similarity_report(path_a, path_b)
