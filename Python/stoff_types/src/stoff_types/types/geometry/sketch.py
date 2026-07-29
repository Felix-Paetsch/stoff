from __future__ import annotations

from dataclasses import dataclass, field
from typing import TypeAlias

from .polygon import Polygon
from .polyline import Polyline
from .vector import Vector

Record: TypeAlias = dict[str, str]
Shape: TypeAlias = "Polyline | Polygon"


@dataclass
class Sketch:
    data: Record = field(default_factory=dict)
    points: list[SketchPoint] = field(default_factory=list)
    lines: list[SketchLine] = field(default_factory=list)

    def add_point(
        self,
        vec: Vector,
        data: Record | None = None,
    ) -> SketchPoint:
        point = SketchPoint(
            sketch=self,
            vec=vec,
            data={} if data is None else data.copy(),
        )

        self.points.append(point)
        return point

    def add_line(
        self,
        shape: Shape,
        from_point: SketchPoint,
        to_point: SketchPoint,
        right_handed: bool = True,
        data: Record | None = None,
    ) -> SketchLine:
        self._validate_point(from_point)
        self._validate_point(to_point)

        line = SketchLine(
            sketch=self,
            shape=shape,
            data={} if data is None else data.copy(),
            endpoints=(from_point, to_point),
            right_handed=right_handed,
        )

        self.lines.append(line)
        return line

    def remove_point(self, point: SketchPoint) -> SketchPoint:
        self._validate_point(point)

        connected_lines = [line for line in self.lines if point in line.endpoints]

        for line in connected_lines:
            self.remove_line(line)

        self.points.remove(point)
        point.sketch = None
        return point

    def remove_line(self, line: SketchLine) -> SketchLine:
        self._validate_line(line)

        self.lines.remove(line)
        line.sketch = None
        return line

    def _validate_point(self, point: SketchPoint) -> None:
        if point.sketch is not self:
            raise ValueError("Point does not belong to this sketch")

        if point not in self.points:
            raise ValueError("Point is not contained in this sketch")

    def _validate_line(self, line: SketchLine) -> None:
        if line.sketch is not self:
            raise ValueError("Line does not belong to this sketch")

        if line not in self.lines:
            raise ValueError("Line is not contained in this sketch")

        for point in line.endpoints:
            self._validate_point(point)


@dataclass
class SketchPoint:
    sketch: Sketch | None
    vec: Vector
    data: Record = field(default_factory=dict)


@dataclass
class SketchLine:
    sketch: Sketch | None
    shape: Shape
    endpoints: tuple[SketchPoint, SketchPoint]
    right_handed: bool = field(default=True)
    data: Record = field(default_factory=dict)
