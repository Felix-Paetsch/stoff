#### Line.set_endpoints(p1,p2)
    => Line (this)

#### Line.set_color(color)
    => Line (this)

#### Line.get_color()
    => String

#### Line.connected_component()
    => ConnectedComponent

#### Line.get_line_vector()
    => Vector

#### Line.get_endpoints()
    => Point[2]

#### Line.p1
    => Point

#### Line.p2
    => Point

#### Line.get_tangent_vector(pt: Point)
    Get Tangent Vector at Endpoint
    => Vector

#### Line.mirror(direction: boolean)
    Mirrors Line along y-Axis (true) or
    x-Axis (false)
    => Line (this)

#### Line.swap_orientation()
    Swaps line.p1 and line.p2
    => Line (this)

#### Line.endpoint_distance()
    => Number

#### Line.get_length()
    => Number

#### Line.get_bounding_box()
    Bounding Box around line
    =>  {
            width:  Number,
            height: Number,
            top_left:     Vector,
            top_right:    Vector,
            bottom_left:  Vector,
            bottom_right: Vector
        }

#### Line.self_intersects()
    => Boolean