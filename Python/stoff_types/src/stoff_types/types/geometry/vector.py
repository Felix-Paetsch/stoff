from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class Vector:
    x: float
    y: float
