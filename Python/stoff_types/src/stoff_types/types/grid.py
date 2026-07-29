from __future__ import annotations

from dataclasses import dataclass
from typing import Generic, Literal, TypeAlias, TypeVar

from .geometry.matrix import Matrix
from .geometry.vector import Vector

T = TypeVar("T")
GridType = TypeVar("GridType", bound=str)

LatticeDimensions: TypeAlias = tuple[int, int]
DomainDimensions: TypeAlias = tuple[float, float, float, float]


@dataclass
class GridDimensions:
    lattice_dimensions: LatticeDimensions
    domain_dimensions: DomainDimensions

    def __post_init__(self) -> None:
        lattice_width, lattice_height = self.lattice_dimensions
        _, _, domain_width, domain_height = self.domain_dimensions

        if lattice_width <= 1 or lattice_height <= 1:
            raise ValueError("Lattice dimensions must both be greater than 1")

        if domain_width <= 0 or domain_height <= 0:
            raise ValueError("The last two domain dimensions must be greater than 0")


@dataclass
class Grid(Generic[T, GridType]):
    dimensions: GridDimensions
    values: list[T]
    type: GridType

    def __post_init__(self) -> None:
        lattice_width, lattice_height = self.dimensions.lattice_dimensions
        expected_value_count = lattice_width * lattice_height

        if len(self.values) != expected_value_count:
            raise ValueError(
                "The number of values must equal the product of the lattice dimensions"
            )


NumberGrid: TypeAlias = Grid[float, Literal["number"]]
VectorGrid: TypeAlias = Grid[Vector, Literal["vector"]]
MatrixGrid: TypeAlias = Grid[Matrix, Literal["matrix"]]
BooleanGrid: TypeAlias = Grid[bool, Literal["boolean"]]
Vec3Grid: TypeAlias = Grid[tuple[float, float, float], Literal["vec3"]]
