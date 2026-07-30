from collections.abc import Callable
from typing import Any

from stoff_types import Sketch


def hi(value: str) -> str:
    return f"Hi, {value}!"


def hi_sketch(value: str, sk: Sketch) -> str:
    print(sk)
    return f"Hi, {value}!"


def hi_n(value: str, number: int | float) -> str:
    return f"Hi, {value}! Your number is {number}."


method_dict: dict[str, Callable[..., Any]] = {
    "hi": hi,
    "hi_n": hi_n,
    "hi_sketch": hi_sketch,
}
