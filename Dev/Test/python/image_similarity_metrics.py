from __future__ import annotations

from pathlib import Path

import numpy as np

try:
    from .tools import load_image, resize_to_common_size, to_grayscale_array
except ImportError:
    from tools import load_image, resize_to_common_size, to_grayscale_array

try:
    from scipy.ndimage import distance_transform_edt as scipy_edt

    HAS_SCIPY = True
except ImportError:
    HAS_SCIPY = False


def _load_resized_rgb(
    path_a: str | Path, path_b: str | Path
) -> tuple[np.ndarray, np.ndarray]:
    img_a = load_image(path_a)
    img_b = load_image(path_b)
    arr_a, arr_b = resize_to_common_size(img_a, img_b)
    arr_a = np.asarray(arr_a, dtype=np.float32)
    arr_b = np.asarray(arr_b, dtype=np.float32)
    return arr_a, arr_b


def _clip_similarity(value: float) -> float:
    return float(np.clip(value, 0.0, 1.0))


def _safe_mean(values: np.ndarray) -> float:
    if values.size == 0:
        return 0.0
    return float(np.mean(values))


def _rgb_to_gray(arr: np.ndarray) -> np.ndarray:
    return (
        0.299 * arr[:, :, 0] + 0.587 * arr[:, :, 1] + 0.114 * arr[:, :, 2]
    ).astype(np.float32)


def _binary_mask_from_gray(
    gray: np.ndarray, threshold: float = 20.0
) -> np.ndarray:
    return gray >= threshold


def _extract_dominant_color_label(
    arr: np.ndarray, min_intensity: float = 40.0, min_margin: float = 20.0
) -> np.ndarray:
    """
    Assign a color label per pixel:
    - 0 = background / no dominant color
    - 1 = red
    - 2 = green
    - 3 = blue

    A channel is considered dominant if:
    - it is at least min_intensity
    - it exceeds the next-largest channel by min_margin
    """
    arr = arr.astype(np.float32)
    max_idx = np.argmax(arr, axis=2)
    sorted_channels = np.sort(arr, axis=2)
    largest = sorted_channels[:, :, 2]
    second = sorted_channels[:, :, 1]

    strong_enough = largest >= min_intensity
    separated_enough = (largest - second) >= min_margin
    valid = strong_enough & separated_enough

    labels = np.zeros(arr.shape[:2], dtype=np.uint8)
    labels[valid & (max_idx == 0)] = 1
    labels[valid & (max_idx == 1)] = 2
    labels[valid & (max_idx == 2)] = 3
    return labels


def _mask_iou(mask_a: np.ndarray, mask_b: np.ndarray) -> float:
    union = np.logical_or(mask_a, mask_b).sum()
    if union == 0:
        return 1.0
    intersection = np.logical_and(mask_a, mask_b).sum()
    return float(intersection / union)


def _edt_1d(d: np.ndarray) -> np.ndarray:
    """
    1D Euclidean distance transform (squared).
    Used by separable 2D distance transform.
    """
    n = len(d)
    result = np.zeros(n, dtype=np.float32)

    for i in range(n):
        result[i] = d[i]
        if i > 0 and d[i] != 0:
            result[i] = min(result[i], result[i - 1] + 1.0)

    for i in range(n - 2, -1, -1):
        if d[i] != 0:
            result[i] = min(result[i], result[i + 1] + 1.0)

    return result**2


def _distance_transform_edt(mask: np.ndarray) -> np.ndarray:
    """
    Compute Euclidean distance transform.

    Returns, for each pixel, the Euclidean distance to the nearest True pixel
    in mask.
    """
    if HAS_SCIPY:
        return scipy_edt(mask).astype(np.float32)

    h, w = mask.shape

    if not mask.any():
        return np.full((h, w), np.sqrt(h * h + w * w), dtype=np.float32)

    dist = np.zeros((h, w), dtype=np.float32)
    dist[~mask] = np.inf

    for _ in range(2):
        for axis in range(2):
            dist = np.apply_along_axis(_edt_1d, axis=axis, arr=dist)

    return np.sqrt(dist).astype(np.float32)


def _symmetric_chamfer_similarity(
    mask_a: np.ndarray, mask_b: np.ndarray, scale: float = 5.0
) -> float:
    """
    Compare two binary masks using symmetric chamfer distance, then convert
    distance into similarity in [0, 1].
    """
    if not mask_a.any() and not mask_b.any():
        return 1.0
    if not mask_a.any() or not mask_b.any():
        return 0.0

    dt_a = _distance_transform_edt(mask_a)
    dt_b = _distance_transform_edt(mask_b)

    dist_ab = _safe_mean(dt_a[mask_b])
    dist_ba = _safe_mean(dt_b[mask_a])
    dist = 0.5 * (dist_ab + dist_ba)

    similarity = np.exp(-dist / max(scale, 1e-12))
    return _clip_similarity(float(similarity))


def similarity_mse(path_a: str | Path, path_b: str | Path) -> float:
    """
    Similarity based on mean squared error.
    """
    arr_a, arr_b = _load_resized_rgb(path_a, path_b)

    mse = np.mean((arr_a - arr_b) ** 2)
    max_mse = 255.0**2
    similarity = 1.0 - (mse / max_mse)
    return _clip_similarity(float(similarity))


def similarity_mae(path_a: str | Path, path_b: str | Path) -> float:
    """
    Similarity based on mean absolute error.
    """
    arr_a, arr_b = _load_resized_rgb(path_a, path_b)

    mae = np.mean(np.abs(arr_a - arr_b))
    max_mae = 255.0
    similarity = 1.0 - (mae / max_mae)
    return _clip_similarity(float(similarity))


def similarity_histogram(
    path_a: str | Path, path_b: str | Path, bins: int = 32
) -> float:
    """
    Compare images by RGB color histograms.

    Tolerant to small shifts/layout differences, but not very sensitive to
    exact structure.
    """
    arr_a, arr_b = _load_resized_rgb(path_a, path_b)

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
    return _clip_similarity(float(similarity))


def similarity_ssim(path_a: str | Path, path_b: str | Path) -> float:
    """
    Structural similarity (global SSIM-style approximation).
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
    return _clip_similarity(float(ssim))


def similarity_edge_iou(
    path_a: str | Path,
    path_b: str | Path,
    gray_threshold: float = 20.0,
) -> float:
    """
    IoU of foreground/line masks derived from grayscale intensity.

    Good when the lines are thick and aligned reasonably well.
    Less tolerant to shifts than chamfer.
    """
    arr_a, arr_b = _load_resized_rgb(path_a, path_b)
    gray_a = _rgb_to_gray(arr_a)
    gray_b = _rgb_to_gray(arr_b)

    mask_a = _binary_mask_from_gray(gray_a, threshold=gray_threshold)
    mask_b = _binary_mask_from_gray(gray_b, threshold=gray_threshold)
    return _clip_similarity(_mask_iou(mask_a, mask_b))


def similarity_edge_chamfer(
    path_a: str | Path,
    path_b: str | Path,
    gray_threshold: float = 20.0,
    scale: float = 5.0,
) -> float:
    """
    Shift-tolerant shape similarity based on foreground masks.

    This is particularly useful for polylines and line drawings where
    small offsets or resampling changes should still count as similar.
    """
    arr_a, arr_b = _load_resized_rgb(path_a, path_b)
    gray_a = _rgb_to_gray(arr_a)
    gray_b = _rgb_to_gray(arr_b)

    mask_a = _binary_mask_from_gray(gray_a, threshold=gray_threshold)
    mask_b = _binary_mask_from_gray(gray_b, threshold=gray_threshold)
    return _symmetric_chamfer_similarity(mask_a, mask_b, scale=scale)


def similarity_dominant_color_iou(
    path_a: str | Path,
    path_b: str | Path,
    min_intensity: float = 40.0,
    min_margin: float = 20.0,
) -> float:
    """
    Compare dominant-color masks spatially.

    This distinguishes things like a red line vs a blue line, because
    masks are created separately for red, green, and blue.

    Returns the mean IoU across the three dominant-color masks.
    """
    arr_a, arr_b = _load_resized_rgb(path_a, path_b)

    labels_a = _extract_dominant_color_label(
        arr_a, min_intensity=min_intensity, min_margin=min_margin
    )
    labels_b = _extract_dominant_color_label(
        arr_b, min_intensity=min_intensity, min_margin=min_margin
    )

    sims = []
    for label in (1, 2, 3):
        mask_a = labels_a == label
        mask_b = labels_b == label
        sims.append(_mask_iou(mask_a, mask_b))

    return _clip_similarity(float(np.mean(sims)))


def similarity_dominant_color_chamfer(
    path_a: str | Path,
    path_b: str | Path,
    min_intensity: float = 40.0,
    min_margin: float = 20.0,
    scale: float = 5.0,
) -> float:
    """
    Compare dominant-color masks using shift-tolerant chamfer similarity.

    This is often the best metric for your use case:
    - distinguishes red vs blue
    - tolerates small position shifts
    - tolerates slightly different polyline sampling
    """
    arr_a, arr_b = _load_resized_rgb(path_a, path_b)

    labels_a = _extract_dominant_color_label(
        arr_a, min_intensity=min_intensity, min_margin=min_margin
    )
    labels_b = _extract_dominant_color_label(
        arr_b, min_intensity=min_intensity, min_margin=min_margin
    )

    sims = []
    for label in (1, 2, 3):
        mask_a = labels_a == label
        mask_b = labels_b == label
        sims.append(_symmetric_chamfer_similarity(mask_a, mask_b, scale=scale))

    return _clip_similarity(float(np.mean(sims)))


def similarity_color_histogram_per_channel_shape_weighted(
    path_a: str | Path,
    path_b: str | Path,
    bins: int = 32,
) -> float:
    """
    A hybrid metric:
    - global RGB histogram agreement
    - plus shape agreement of foreground masks

    This can be useful as a softer, more forgiving summary score.
    """
    hist_sim = similarity_histogram(path_a, path_b, bins=bins)
    edge_sim = similarity_edge_chamfer(path_a, path_b)
    color_shape_sim = similarity_dominant_color_chamfer(path_a, path_b)
    return _clip_similarity(
        0.25 * hist_sim + 0.25 * edge_sim + 0.50 * color_shape_sim
    )


SIMILARITY_METRICS = {
    "ssim": similarity_ssim,
    "mse": similarity_mse,
    "mae": similarity_mae,
    "histogram": similarity_histogram,
    "edge_iou": similarity_edge_iou,
    "edge_chamfer": similarity_edge_chamfer,
    "dominant_color_iou": similarity_dominant_color_iou,
    "dominant_color_chamfer": similarity_dominant_color_chamfer,
    "hybrid": similarity_color_histogram_per_channel_shape_weighted,
}
