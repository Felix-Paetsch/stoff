#### new Point(
    x: Vector | Number, 
    y: Number | null,
    color = black: String
)
    => Point

#### Point.from_vector(
    vec: Vector
)
    => Point


#### Point.vector()
    => Vector

#### Point.set_color(color: String)
    => Point (this)

#### Point.get_color()
    => String

#### Point.copy()
    Creates Point (not in sketch) at same positon
    => Point

#### Point.get_tangent_vector(line: Line)
    If point is endpoint of line, return the tangentvector
    at that point to on the line
    => Vector

#### Point.get_adjacent_lines()
    => Lines[]

#### Point.move_to(
    x: Vector | Number,
    y: Vector | null
)
    => Point (this)

#### Point.offsetBy(
    x: Vector | Number,
    y: Vector | null
)
    => Point (this)

#### Point.hasLines(
    ...lines: Line[]
)
    => Boolean
