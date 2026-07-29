from typing import Any, Literal, TypedDict

from .geometry import Polygon, Polyline, Vector
from .index import Sketch
from .number_array import destringify_f64_array, stringify_f64_array


class SerializedSketch(TypedDict):
    type: Literal["sketch"]
    data: Any


def serialize_sketch(sketch: Sketch) -> SerializedSketch:
    points = sketch.points
    return {
        "type": "sketch",
        "data": {
            "sketch_data": sketch.data,
            "points": [{"data": p.data, "vec": [p.vec.x, p.vec.y]} for p in points],
            "lines": [
                {
                    "data": line.data,
                    "is_polygon": isinstance(line.shape, Polygon),
                    "verts": stringify_f64_array(line.shape.points),
                    "endpoints": [
                        points.index(line.endpoints[0]),
                        points.index(line.endpoints[1]),
                    ],
                    "right_handed": line.right_handed,
                }
                for line in sketch.lines
            ],
        },
    }


def deserialize_sketch(value: SerializedSketch) -> Sketch:
    d = value["data"]

    sketch = Sketch()
    sketch.data = d["sketch_data"]

    pts = [
        sketch.add_point(Vector(p["vec"][0], p["vec"][1]), data=p["data"])
        for p in d["points"]
    ]

    for line in d["lines"]:
        shape_positions = destringify_f64_array(line["verts"])
        if line["is_polygon"]:
            shape: Polyline | Polygon = Polygon(shape_positions)
        else:
            shape = Polyline(shape_positions)

        sketch.add_line(
            shape,
            pts[line["endpoints"][0]],
            pts[line["endpoints"][1]],
            right_handed=line["right_handed"],
            data=line["data"],
        )

    return sketch
