
#### Sketch.get_bounding_box()
    Bounding Box around points and lines inside sketch
    =>  {
            width:  Number,
            height: Number,
            top_left:     Vector,
            top_right:    Vector,
            bottom_left:  Vector,
            bottom_right: Vector
        }

#### Sketch.point(x: Number, y: Number)
    Creates point at position (x,y)
    => Point
#### Sketch.point(x: Vector)
    Creates point at vector position, not Points are also vectors
    => Point

#### Sketch.add_point(pt: Point)
    Adds point to sketch (i.e. use when Point has Data on it)
    => Point

#### Sketch.get_points()
    => Point[]

#### Sketch.get_lines()
    => Line[]

#### Sketch.connected_component(x: Point | Line)
    Returns connected component of point or line
    => ConnectedComponent

#### Sketch.get_connected_components()
    Returns array of all connected components in sketch
    => ConnectedComponent[]

#### Sketch.line_between_points(pt1: Point, pt2: Point)
    Draws straight line between points
    => Line

#### Sketch.line_from_function_graph(
    pt1: Point, 
    pt2: Point, 
    f_1: Number -> Number
)
    Draw function graph between points, as if
    endpoints where (0,0) and (1,0) on x-Axis
    => Line

#### Sketch.line_from_function_graph(
    pt1: Point, 
    pt2: Point, 
    x: Number -> Number, 
    y: Number -> Number
)
    Draw parameterized curve (x(t), y(t)) between points
    with pt1 being (0,0) and pt2 being (1,0)
    => Line

#### Sketch.interpolate_lines(
    line1: Line, 
    line2: Line, 
    direction = 0: 0 | 1 | 2 | 3,
    f  = (x) => x: Number -> Number,
    p1 = (x) => x: Number -> Number,
    p2 = (x) => x: Number -> Number
)
    Draw the function
        t -> p1(t) * (1 - f(t)) + p2(t) * f(t)
    as t goes from 0 to 1 and p1(t) traverses line1 and p2(t) traverses line2.
    The direction determines in which direction each line is traversed.
    => Line

#### Sketch.merge_lines(
    line1: Line,
    line2: Line,
    datacallback = default_callback: Datacallback
)
    Merge the two lines at their common point (and remove them)
    => Line

#### Sketch.point_on_line(pt: Point, line: Line)
    Assumes Point lies on line. Splits the line into two parts
    which are lines together at pt
    => {
        line_segments: Line[2],
        point: Point
    }

#### Sketch.intersect_lines(line1: Line, line2: Line)
    Assumes line1 is straight
    Inserts intersection points of lines and splits them according to them
    into line segments
    => {
        intersection_points: Point[],
        l1_segments: Line[],
        l2_segments: Line[]
    }

#### Sketch.intersection_positions(line1: Line, line2: Line)
    Assumes line1 is straight
    Returns intersection positions of lines
    => Vector[]

#### Sketch.line_with_offset(line: Line, offset: Number, direction: 0 | 1)
    Creates new line (including points) with given offset from one line in
    corresponding direction
    => {
        p1: Point,
        p2: Point,
        line: Line
    }

#### Sketch.copy_line(
    line: Line, 
    from: Point, 
    to:   Point,
    datacallback = default_callback: Datacallback
)
    => Line

#### Sketch.remove_line(
    line: Line, 
)

#### Sketch.remove_lines(
    ...lines: Line[], 
)

#### Sketch.remove_point(
    pt: Point, 
)

#### Sketch.remove_points(
    ...pt: Point[], 
)

#### Sketch.remove(
    ...els: (Point | Line)[], 
)

#### Sketch.clean()
    Clears Sketch (removes points, lines, data)

#### Sketch.has_points(...points: Point[])
    => Boolean

#### Sketch.has_lines(...lines: Line[])
    => Boolean
    
#### Sketch.has_sketch_elements(
    ...elements: (Point | Line)[]
)
    => Boolean
    
#### Sketch.has(
    ...elements: (Point | Line)[]
)
    Alias for has_sketch_elements
    => Boolean
    
#### Sketch.paste_sketch(
    sketch: Sketch
    datacallback = default_callback | null: Datacallback,
    position = null: Vector | null 
)
    Pastes sketch into the current sketch. If position is null, the coordinates
    from the old sketch will be used. Else the top left corner of the bounding_box
    will be placed at the position vector
    => datacallback() || sketch.data
    
#### Sketch.paste_connected_component(
    cc: ConnectedComponent
    position = null: Vector | null 
)
    Pastes component into the current sketch. If position is null, the coordinates
    from the component will be used. Else the top left corner of the bounding_box
    will be placed at the position vector
    => ConnectedComponent
    
#### Sketch.save_on_A4(folder: FolderPath)
    Create folder `folder` and creates A4 pages inside it with the sketch to scale

#### Sketch.to_svg(width: Number | null, height = null: Number | null)
    Render Sketch as SVG. If only one of width or height is given,
    scale the other according to aspect ratio
    => String (svg)

#### Sketch.save_as_svg(save_to: FilePath, width: Number, height: Number)
    Saves SVG at corresponding path

#### Sketch.to_png(width: Number | null, height = null: Number | null)
    Render Sketch as PNG. If only one of width or height is given,
    scale the other according to aspect ratio
    => Buffer (png)

#### Sketch.save_as_png(save_to: FilePath, width: Number, height: Number)
    Saves PNG at corresponding path
