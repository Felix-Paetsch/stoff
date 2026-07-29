from typing import Any, Literal, TypedDict

from .index import Matrix, Polygon, Polyline, Vector
from .number_array import destringify_f64_array, stringify_f64_array


class SerializedPolyline(TypedDict):
    type: Literal["polyline"]
    data: Any


class SerializedPolygon(TypedDict):
    type: Literal["polygon"]
    data: Any


class SerializedVector(TypedDict):
    type: Literal["vector"]
    data: Any


class SerializedMatrix(TypedDict):
    type: Literal["matrix"]
    data: Any


def serialize_polyline(line: Polyline) -> SerializedPolyline:
    return {"type": "polyline", "data": stringify_f64_array(line.points)}


def serialize_polygon(polygon: Polygon) -> SerializedPolygon:
    return {"type": "polygon", "data": stringify_f64_array(polygon.points)}


def serialize_vector(vector: Vector) -> SerializedVector:
    return {"type": "vector", "data": [vector.x, vector.y]}


def serialize_matrix(matrix: Matrix) -> SerializedMatrix:
    return {
        "type": "matrix",
        "data": [matrix.a, matrix.b, matrix.c, matrix.d],
    }


def deserialize_polyline(value: SerializedPolyline) -> Polyline:
    return Polyline(destringify_f64_array(value["data"]))


def deserialize_polygon(value: SerializedPolygon) -> Polygon:
    return Polygon(destringify_f64_array(value["data"]))


def deserialize_vector(value: SerializedVector) -> Vector:
    x, y = value["data"]
    return Vector(x, y)


def deserialize_matrix(value: SerializedMatrix) -> Matrix:
    a, b, c, d = value["data"]
    return Matrix(a, b, c, d)
