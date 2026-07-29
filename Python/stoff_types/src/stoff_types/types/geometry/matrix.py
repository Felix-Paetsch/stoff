from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class Matrix:
    """
    A 2 × 2 matrix.

    The entries are stored in row-major order:

        | a b |
        | c d |
    """

    a: float
    b: float
    c: float
    d: float
