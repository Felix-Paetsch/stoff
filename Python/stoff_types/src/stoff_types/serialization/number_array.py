import base64
from collections.abc import Sequence
from typing import Union

import numpy as np

F64Values = Union[Sequence[int | float], np.ndarray]
U8Values = Union[bytes, bytearray, memoryview, np.ndarray]


def stringify_f64_array(values: F64Values) -> str:
    """
    Encode numbers as little-endian IEEE-754 Float64 values and return
    the result as base64.
    """
    values_array = np.asarray(values, dtype="<f8")

    return base64.b64encode(values_array.tobytes(order="C")).decode("ascii")


def stringify_u8_array(values: U8Values) -> str:
    """
    Encode raw unsigned 8-bit values as base64.
    """
    if isinstance(values, np.ndarray):
        values_array = values
    else:
        values_array = np.frombuffer(
            bytes(values),
            dtype=np.uint8,
        )

    if values_array.dtype != np.uint8:
        raise TypeError("Uint8 array requires dtype numpy.uint8")

    return base64.b64encode(values_array.tobytes(order="C")).decode("ascii")


def destringify_f64_array(base64_value: str) -> np.ndarray:
    """
    Decode base64 data containing little-endian IEEE-754 Float64 values
    into a NumPy float64 array.
    """
    buffer = base64.b64decode(base64_value)

    if len(buffer) % 8 != 0:
        raise ValueError(
            "Invalid Float64Array data: byte length must be divisible by 8."
        )

    return np.frombuffer(buffer, dtype="<f8").copy()


def destringify_u8_array(base64_value: str) -> np.ndarray:
    """
    Decode base64 data into a NumPy uint8 array.
    """
    return np.frombuffer(
        base64.b64decode(base64_value),
        dtype=np.uint8,
    ).copy()
