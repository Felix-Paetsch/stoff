from typing import TypeAlias

import numpy as np

from ..types.geometry.matrix import Matrix
from ..types.geometry.polygon import Polygon
from ..types.geometry.polyline import Polyline
from ..types.geometry.sketch import Sketch
from ..types.geometry.vector import Vector
from ..types.graph import LengthGraph, ShapeGraph, VertexGraph
from ..types.grid import BooleanGrid, MatrixGrid, NumberGrid, Vec3Grid, VectorGrid
from ..types.image import GrayImage, RGBImage

StoffSerializable: TypeAlias = (
    str
    | float
    | bool
    | None
    | Polygon
    | Polyline
    | Vector
    | Matrix
    | Sketch
    | RGBImage
    | GrayImage
    | NumberGrid
    | VectorGrid
    | MatrixGrid
    | BooleanGrid
    | Vec3Grid
    | VertexGraph
    | LengthGraph
    | ShapeGraph
    | np.ndarray
    | dict[str, "StoffSerializable"]
    | list["StoffSerializable"]
)
