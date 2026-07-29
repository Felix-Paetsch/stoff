import json
from typing import Any, TypeAlias, cast

from .geometry import (
    SerializedMatrix,
    SerializedPolygon,
    SerializedPolyline,
    SerializedVector,
    deserialize_matrix,
    deserialize_polygon,
    deserialize_polyline,
    deserialize_vector,
)
from .graph import (
    SerializedLengthGraph,
    SerializedShapeGraph,
    SerializedVertexGraph,
    deserialize_length_graph,
    deserialize_shape_graph,
    deserialize_vertex_graph,
)
from .grid import (
    SerializedBooleanGrid,
    SerializedMatrixGrid,
    SerializedNumberGrid,
    SerializedVec3Grid,
    SerializedVectorGrid,
    deserialize_boolean_grid,
    deserialize_matrix_grid,
    deserialize_number_grid,
    deserialize_vec3_grid,
    deserialize_vector_grid,
)
from .image import (
    SerializedGrayImage,
    SerializedRGBImage,
    deserialize_gray_image,
    deserialize_rgb_image,
)
from .index import StoffSerializable, Vector
from .number_array import destringify_f64_array, destringify_u8_array
from .sketch import SerializedSketch, deserialize_sketch

StoffSerializableTag: TypeAlias = str


def deserialize(s: str) -> StoffSerializable:
    return deserialize_from_json(json.loads(s))


def deserialize_from_json(r: dict[str, Any]) -> StoffSerializable:
    type_name = r["type"]
    data = r.get("data")

    if data is None:
        raise ValueError("JSON object must contain non-null 'data'")

    if type_name == "uint8_array":
        return destringify_u8_array(data)

    if type_name == "number_array":
        return destringify_f64_array(data)

    if type_name == "string":
        return cast(str, data)

    if type_name == "number":
        return cast(int | float, data)

    if type_name == "boolean":
        return cast(bool, data)

    if type_name == "null":
        return None

    if type_name == "rgb_image":
        return deserialize_rgb_image(cast(SerializedRGBImage, r))

    if type_name == "gray_image":
        return deserialize_gray_image(cast(SerializedGrayImage, r))

    if type_name == "polyline":
        return deserialize_polyline(cast(SerializedPolyline, r))

    if type_name == "polygon":
        return deserialize_polygon(cast(SerializedPolygon, r))

    if type_name == "vector":
        return deserialize_vector(cast(SerializedVector, r))

    if type_name == "matrix":
        return deserialize_matrix(cast(SerializedMatrix, r))

    if type_name == "sketch":
        return deserialize_sketch(cast(SerializedSketch, r))

    if type_name == "number_grid":
        return deserialize_number_grid(cast(SerializedNumberGrid, r))

    if type_name == "vector_grid":
        return deserialize_vector_grid(cast(SerializedVectorGrid, r))

    if type_name == "vec3_grid":
        return deserialize_vec3_grid(cast(SerializedVec3Grid, r))

    if type_name == "boolean_grid":
        return deserialize_boolean_grid(cast(SerializedBooleanGrid, r))

    if type_name == "matrix_grid":
        return deserialize_matrix_grid(cast(SerializedMatrixGrid, r))

    if type_name == "length_graph":
        return deserialize_length_graph(cast(SerializedLengthGraph, r))

    if type_name == "vertex_graph":
        return deserialize_vertex_graph(cast(SerializedVertexGraph, r))

    if type_name == "shape_graph":
        return deserialize_shape_graph(cast(SerializedShapeGraph, r))

    if type_name == "vector_array":
        values = destringify_f64_array(data)

        if len(values) % 2 != 0:
            raise ValueError("Invalid vector_array: the number of values must be even")

        res = [
            Vector(values[index], values[index + 1])
            for index in range(0, len(values), 2)
        ]

        return cast(list["StoffSerializable"], res)

    if type_name == "array":
        values = cast(list[dict[str, Any]], data)

        return [deserialize_from_json(value) for value in values]

    if type_name == "object":
        values = cast(dict[str, dict[str, Any]], data)

        return {key: deserialize_from_json(value) for key, value in values.items()}

    raise ValueError(f"Unsupported transmittable type: {type_name}")
