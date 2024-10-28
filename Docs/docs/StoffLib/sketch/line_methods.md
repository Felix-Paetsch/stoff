# Line Methods

To understand this page it is really helpful for you to first be compfortable with [how lines work.](#) Recall that a line has two endpoints, and is basically a long and fine poly-line. The sample points or verticies of the polyline are relative to `Vec(0,0)` and `Vec(1,0)` which then get mapped to the endpoints.

```js
import { Sketch } from './Stofflib/sketch.js';
import { Point } from './Stofflib/point.js';
import { Vector } from './Stofflib/geometry.js';
import { default_data_callback } from './Stofflib/copy.js';
type DataCallback : (Object, Object) -> Object;

class Sketch{
    constructor(){
        this.data   : Any = {};
    }
    
    ...

    // Line methods
    line_between_points(p1, p2 : Point){} : Line
    line_with_length(p1, p2 : Point, length : Number){} : Line;
    line_from_function_graph(pt1, pt2 : Point, f_1, f_2 : Number -> Number){} : Line;
    plot(pt1, pt2 : Point, f_1, f_2 : Number -> Number){} : Line;
    line_with_offset(line : Line, offset : Number, direction : Boolean = false){} : {
        p1, p2 : Point,
        line: Line
    }
    copy_line(
        line : Line, from, to : Point,
        data_callback : DataCallback = default_data_callback
    ){} : Line

    interpolate_lines(
        line1, line2 : Line, direction : Number = 0, 
        f = (x) => x, p1 = (x) => x, p2 = (x) => x : Number -> Number
    ){} : Line;
    merge_lines(
        line1, line2 : Line, 
        data_callback : DataCallback = default_data_callback
    ){} : Line

    point_on_line(
        pt : Point, line : Line, 
        data_callback : DataCallback = default_data_callback
    ){} : {
        line_segments : Line[2],
        point: Point
    }
    position_at_length(
        line : Line, length : Number, reversed : Boolean = false
    ){} : Vector
    intersect_lines(line1, line2 : Line){} :  {
        intersection_points: Points[],
        l1_segments: Line[],
        l2_segments: Line[]
    }
    intersection_positions(line1, line2 : Line){} : Vector[]

    ...
}
```

To see all methods on one page, see the [introduction page.](introduction.md)

# Methods
###
line_between_points(p1, p2 : Point){} : Line
    line_with_length(p1, p2 : Point, length : Number){} : Line;
    line_from_function_graph(pt1, pt2 : Point, f_1, f_2 : Number -> Number){} : Line;
    plot(pt1, pt2 : Point, f_1, f_2 : Number -> Number){} : Line;
    line_with_offset(line : Line, offset : Number, direction : Boolean = false){} : {
        p1, p2 : Point,
        line: Line
    }
    copy_line(
        line : Line, from, to : Point,
        data_callback : DataCallback = default_data_callback
    ){} : Line

    interpolate_lines(
        line1, line2 : Line, direction : Number = 0, 
        f = (x) => x, p1 = (x) => x, p2 = (x) => x : Number -> Number
    ){} : Line;
    merge_lines(
        line1, line2 : Line, 
        data_callback : DataCallback = default_data_callback
    ){} : Line

    point_on_line(
        pt : Point, line : Line, 
        data_callback : DataCallback = default_data_callback
    ){} : {
        line_segments : Line[2],
        point: Point
    }
    position_at_length(
        line : Line, length : Number, reversed : Boolean = false
    ){} : Vector
    intersect_lines(line1, line2 : Line){} :  {
        intersection_points: Points[],
        l1_segments: Line[],
        l2_segments: Line[]
    }
    intersection_positions(line1, line2 : Line){} : Vector[]

### Point
`.point(x: Number, y: Number){} : Point`

Adds a point to the sketch at position `(x,y)` and returns it.

### Add Point
```js
.add_point(
    p : Point | Vector          , // OR
    x, y : Number 
){} : Point
```

### Merge Points
```js
.merge_points(
    pt1, pt2 : Point,
    data_callback : DataCallback = default_data_callback
){} : Point
```

Merges the points `pt1` and `pt2` into the point `pt1` and removes `pt2` from the sketch. This throws an error if the points are not above each other.

The `data_callback` describes how the data objects of the two points should be merged into the data object of `pt1`. To learn more about data callbacks, see [here](#).

### Remove methods

For the methods to remove a point from the sketch, see [General Functionality](./general.md#remove-point) as it is grouped there with the other remove methods.