from typing import Any, Literal, TypedDict

from ..types.grid import (
    Grid,
    GridDimensions,
)
from .index import (
    BooleanGrid,
    Matrix,
    MatrixGrid,
    NumberGrid,
    Vec3Grid,
    Vector,
    VectorGrid,
)
from .number_array import (
    destringify_f64_array,
    destringify_u8_array,
    stringify_f64_array,
    stringify_u8_array,
)


class SerializedNumberGrid(TypedDict):
    type: Literal["number_grid"]
    data: Any


class SerializedVectorGrid(TypedDict):
    type: Literal["vector_grid"]
    data: Any


class SerializedVec3Grid(TypedDict):
    type: Literal["vec3_grid"]
    data: Any


class SerializedBooleanGrid(TypedDict):
    type: Literal["boolean_grid"]
    data: Any


class SerializedMatrixGrid(TypedDict):
    type: Literal["matrix_grid"]
    data: Any


def _serialize_dimensions(dimensions: GridDimensions) -> dict[str, Any]:
    return {
        "lattice_dimensions": list(dimensions.lattice_dimensions),
        "domain_dimensions": list(dimensions.domain_dimensions),
    }


def _deserialize_dimensions(data: Any) -> GridDimensions:
    return GridDimensions(
        lattice_dimensions=tuple(data["lattice_dimensions"]),
        domain_dimensions=tuple(data["domain_dimensions"]),
    )


def serialize_number_grid(grid: NumberGrid) -> SerializedNumberGrid:
    return {
        "type": "number_grid",
        "data": {
            "dimensions": _serialize_dimensions(grid.dimensions),
            "values": stringify_f64_array(grid.values),
        },
    }


def serialize_vector_grid(grid: VectorGrid) -> SerializedVectorGrid:
    return {
        "type": "vector_grid",
        "data": {
            "dimensions": _serialize_dimensions(grid.dimensions),
            "values": stringify_f64_array(
                [component for v in grid.values for component in (v.x, v.y)]
            ),
        },
    }


def serialize_vec3_grid(grid: Vec3Grid) -> SerializedVec3Grid:
    return {
        "type": "vec3_grid",
        "data": {
            "dimensions": _serialize_dimensions(grid.dimensions),
            "values": stringify_f64_array(
                [component for v in grid.values for component in v]
            ),
        },
    }


def serialize_boolean_grid(grid: BooleanGrid) -> SerializedBooleanGrid:
    return {
        "type": "boolean_grid",
        "data": {
            "dimensions": _serialize_dimensions(grid.dimensions),
            # False: 0, True: 1
            "values": stringify_u8_array(bytes(grid.values)),
        },
    }


def serialize_matrix_grid(grid: MatrixGrid) -> SerializedMatrixGrid:
    return {
        "type": "matrix_grid",
        "data": {
            "dimensions": _serialize_dimensions(grid.dimensions),
            "values": stringify_f64_array(
                [component for m in grid.values for component in (m.a, m.b, m.c, m.d)]
            ),
        },
    }


def deserialize_number_grid(value: SerializedNumberGrid) -> NumberGrid:
    return Grid(
        dimensions=_deserialize_dimensions(value["data"]["dimensions"]),
        values=list(destringify_f64_array(value["data"]["values"])),
        type="number",
    )


def deserialize_vector_grid(value: SerializedVectorGrid) -> VectorGrid:
    values = destringify_f64_array(value["data"]["values"])
    vectors = [Vector(values[i], values[i + 1]) for i in range(0, len(values), 2)]

    return Grid(
        dimensions=_deserialize_dimensions(value["data"]["dimensions"]),
        values=vectors,
        type="vector",
    )


def deserialize_vec3_grid(value: SerializedVec3Grid) -> Vec3Grid:
    values = destringify_f64_array(value["data"]["values"])
    vectors = [
        (values[i], values[i + 1], values[i + 2]) for i in range(0, len(values), 3)
    ]

    return Grid(
        dimensions=_deserialize_dimensions(value["data"]["dimensions"]),
        values=vectors,
        type="vec3",
    )


def deserialize_boolean_grid(value: SerializedBooleanGrid) -> BooleanGrid:
    values = destringify_u8_array(value["data"]["values"])

    return Grid(
        dimensions=_deserialize_dimensions(value["data"]["dimensions"]),
        values=[v != 0 for v in values],
        type="boolean",
    )


def deserialize_matrix_grid(value: SerializedMatrixGrid) -> MatrixGrid:
    values = destringify_f64_array(value["data"]["values"])
    matrices = [
        Matrix(values[i], values[i + 1], values[i + 2], values[i + 3])
        for i in range(0, len(values), 4)
    ]

    return Grid(
        dimensions=_deserialize_dimensions(value["data"]["dimensions"]),
        values=matrices,
        type="matrix",
    )
