- Shape
    - is_convex
- Polygon
    - contains_point
    - orientation
- Polyline
- Line
    - Vertical
    - Horizontal
- Line Segment
- Ray
- Vector
    - random_orientation
    - ZERO
    - UP
    - DOWN
    - LEFT
    - Right
    - vec_angle
    - vec_angle_clockwise
    - orientation? cross thingy
- Geometry
    - bla..
- Finite Geometry
    - type
    - convex hull...
    - line seg. intersect (?)

- BoundingBox
    - polygon
- Radians
- Degree
- degToRad
- radToDeg

- Matrix
    - smthsmth from in out ?
    - smthsmth orthogonal ?
- type or obj {}? LinearTransformation
    - linear_transform([v1, v2], [va, vb])
    - orthogonal_linear_transform(v1, v2)
    - affine_linear_transform([v1, v2, v3], [va, vb, vc])
    - orthogonal_affine_linear_transform([v1, v2], [va, vb])
    - rotation_transform(angle, around?)
    - mirror_transform(mirror_data)
    or
    - linear
    - orthogonal
    - affine_linear
    - affine_orthogonal
    - ...

- Triangle {}
    - // Maybe can't literally have as object, but as module export, bcs. we want to also have a type here: Triangle.TriangleData
    - triangle data
    - pythagoras
    - pythagorasN

- Interval {}
    - .remap
    - .merge
    - .reparameterize
    - .overlap
    - .lerp
    - type

- MirrorData (only type?)
    - get mirror data

- fraction


todo:
- get rid of row/col with vectors
- not: isLineSegment
