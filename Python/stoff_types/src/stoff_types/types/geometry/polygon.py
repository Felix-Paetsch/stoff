from __future__ import annotations

from dataclasses import dataclass

import numpy as np
import numpy.typing as npt


@dataclass(frozen=True)
class Polygon:
    points: npt.NDArray[np.float64]

    def __post_init__(self) -> None:
        assert self.points.ndim == 1
        assert len(self.points) % 2 == 0
