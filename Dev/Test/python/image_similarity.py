from __future__ import annotations

from pathlib import Path
from typing import Iterable

try:
    from .tools import pairwise
    from .image_similarity_metrics import (
        SIMILARITY_METRICS,
        similarity_dominant_color_chamfer,
        similarity_dominant_color_iou,
        similarity_edge_chamfer,
        similarity_edge_iou,
        similarity_histogram,
        similarity_mae,
        similarity_mse,
        similarity_ssim,
        similarity_color_histogram_per_channel_shape_weighted,
    )
except ImportError:
    from tools import pairwise
    from image_similarity_metrics import (
        SIMILARITY_METRICS,
        similarity_dominant_color_chamfer,
        similarity_dominant_color_iou,
        similarity_edge_chamfer,
        similarity_edge_iou,
        similarity_histogram,
        similarity_mae,
        similarity_mse,
        similarity_ssim,
        similarity_color_histogram_per_channel_shape_weighted,
    )


SIMILARITY_THRESHOLDS = [
    ("ssim", 0.8),
    ("hybrid", 0.95),
    ("dominant_color_chamfer", 0.95),
]

ALL_METRICS_IN_REPORT = [
    "ssim",
    "mse",
    "mae",
    "histogram",
    "edge_iou",
    "edge_chamfer",
    "dominant_color_iou",
    "dominant_color_chamfer",
    "hybrid",
]


def image_similarity(
    path_a: str | Path,
    path_b: str | Path,
    thresholds: list[tuple[str, float]] | None = None,
) -> bool:
    """
    Check if two images are similar enough across multiple metrics.

    Returns True iff the images meet or exceed the similarity threshold
    for all specified metrics.
    """
    if thresholds is None:
        thresholds = SIMILARITY_THRESHOLDS

    for metric_name, threshold in thresholds:
        try:
            metric_fn = SIMILARITY_METRICS[metric_name]
        except KeyError as exc:
            raise ValueError(f"Unknown metric: {metric_name}") from exc

        score = metric_fn(path_a, path_b)
        if score < threshold:
            return False

    return True


def print_similarity_report(path_a: str | Path, path_b: str | Path) -> None:
    """
    Print all similarity measures for a pair of images.
    """
    print("\nComparing:")
    print(f"  A: {path_a}")
    print(f"  B: {path_b}")

    for metric_name in ALL_METRICS_IN_REPORT:
        score = SIMILARITY_METRICS[metric_name](path_a, path_b)
        print(f"  {metric_name:32s} {score:.4f}")

    print(f"  {'Images are similar?':32s} {image_similarity(path_a, path_b)}")


def print_failing_similarity_reports(
    image_paths_a: Iterable[str | Path],
    image_paths_b: Iterable[str | Path],
    thresholds: list[tuple[str, float]] | None = None,
) -> None:
    for path_a in image_paths_a:
        for path_b in image_paths_b:
            if not image_similarity(path_a, path_b, thresholds):
                print_similarity_report(path_a, path_b)


if __name__ == "__main__":
    TEST_IMAGES = [
        "../test_output/sin/out_0.png",
        "../reference_output/sin/out_0.png",
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
