#### new ConnectedComponent(Point | Line)
    => Connected Component

#### ConnectedComponent.root()
    Returns element which the component belongs to
    => Point | Line

#### ConnectedComponent.transform(
    pt_fun: Point -> NIL
)

    Calls a function (e.g. rotation around point) on all Points of that component

#### ConnectedComponent.points()
    => Point[]

#### ConnectedComponent.lines()
    => Line[]

#### ConnectedComponent.get_bounding_box()
    Bounding Box around points and lines inside connected component
    =>  {
            width:  Number,
            height: Number,
            top_left:     Vector,
            top_right:    Vector,
            bottom_left:  Vector,
            bottom_right: Vector
        }

#### ConnectedComponent.obj()
    Generally as fast as the other functions getting a single thing
    => {
        points: Point[],
        lines:  Line[],
        bounding_box: this.get_bounding_box()
    }

#### ConnectedComponent.to_sketch(position = null: null | Vector)
    Isolates connected component to sketch.
    If position is null, the coordinates
    from the component will be used. Else the top left corner of the bounding_box
    will be placed at the position vector.
    => Sketch