import json
from dataclasses import asdict, is_dataclass
from typing import Any, TypeAlias, cast

import numpy as np

from ..types.graph import Graph
from ..types.grid import Grid
from .geometry import (
    serialize_matrix,
    serialize_polygon,
    serialize_polyline,
    serialize_vector,
)
from .graph import serialize_length_graph, serialize_shape_graph, serialize_vertex_graph
from .grid import (
    serialize_boolean_grid,
    serialize_matrix_grid,
    serialize_number_grid,
    serialize_vec3_grid,
    serialize_vector_grid,
)
from .image import serialize_gray_image, serialize_rgb_image
from .index import (
    BooleanGrid,
    GrayImage,
    LengthGraph,
    Matrix,
    MatrixGrid,
    NumberGrid,
    Polygon,
    Polyline,
    RGBImage,
    ShapeGraph,
    Sketch,
    StoffSerializable,
    Vec3Grid,
    Vector,
    VectorGrid,
    VertexGraph,
)
from .number_array import stringify_f64_array, stringify_u8_array
from .sketch import serialize_sketch

StoffSerializableTag: TypeAlias = str


def serialize(r: StoffSerializable, max_depth: int = 5) -> str:
    return json.dumps(serialize_to_json(r, max_depth))


def serialize_to_json(
    r: StoffSerializable,
    max_depth: int = 5,
) -> Any:
    if max_depth == 0:
        raise ValueError("Nested too deep!")

    if isinstance(r, np.ndarray) and r.dtype == np.uint8:
        return {
            "type": "uint8_array",
            "data": stringify_u8_array(r),
        }

    if isinstance(r, np.ndarray):
        if not np.issubdtype(r.dtype, np.number):
            raise TypeError(
                "Only numeric NumPy arrays can be serialized as number_array"
            )

        return {
            "type": "number_array",
            "data": stringify_f64_array(r),
        }

    if isinstance(r, str):
        return {
            "type": "string",
            "data": r,
        }

    if isinstance(r, bool):
        return {
            "type": "boolean",
            "data": r,
        }

    if isinstance(r, (int, float)):
        return {
            "type": "number",
            "data": r,
        }

    if r is None:
        return {
            "type": "null",
            "data": None,
        }

    if isinstance(r, RGBImage):
        return serialize_rgb_image(r)

    if isinstance(r, GrayImage):
        return serialize_gray_image(r)

    if isinstance(r, Polyline):
        return serialize_polyline(r)

    if isinstance(r, Polygon):
        return serialize_polygon(r)

    if isinstance(r, Vector):
        return serialize_vector(r)

    if isinstance(r, Matrix):
        return serialize_matrix(r)

    if isinstance(r, Sketch):
        return serialize_sketch(r)

    if isinstance(r, Grid):
        if r.type == "number":
            return serialize_number_grid(cast("NumberGrid", r))

        if r.type == "vector":
            return serialize_vector_grid(cast("VectorGrid", r))

        if r.type == "vec3":
            return serialize_vec3_grid(cast("Vec3Grid", r))

        if r.type == "boolean":
            return serialize_boolean_grid(cast("BooleanGrid", r))

        return serialize_matrix_grid(cast("MatrixGrid", r))

    if isinstance(r, Graph):
        if r.type == "vertex_graph":
            return serialize_vertex_graph(cast("VertexGraph", r))

        if r.type == "length_graph":
            return serialize_length_graph(cast("LengthGraph", r))

        return serialize_shape_graph(cast("ShapeGraph", r))

    if isinstance(r, list):
        if all(isinstance(value, (int, float)) for value in r):
            return {
                "type": "number_array",
                "data": stringify_f64_array(r),
            }

        if all(isinstance(value, Vector) for value in r):
            values: list[float] = []

            for vector in r:
                values.extend((vector.x, vector.y))

            return {
                "type": "vector_array",
                "data": stringify_f64_array(values),
            }

        return {
            "type": "array",
            "data": [serialize_to_json(value, max_depth - 1) for value in r],
        }

    if isinstance(r, tuple):
        return {
            "type": "array",
            "data": [serialize_to_json(value, max_depth - 1) for value in r],
        }

    if isinstance(r, dict):
        return {
            "type": "object",
            "data": {
                str(key): serialize_to_json(value, max_depth - 1)
                for key, value in r.items()
            },
        }

    if is_dataclass(r):
        return {
            "type": "object",
            "data": {
                key: serialize_to_json(value, max_depth - 1)
                for key, value in asdict(r).items()
            },
        }

    if hasattr(r, "__dict__"):
        return {
            "type": "object",
            "data": {
                key: serialize_to_json(value, max_depth - 1)
                for key, value in vars(r).items()
            },
        }

    raise TypeError(f"Unsupported serializable type: {type(r).__name__}")
