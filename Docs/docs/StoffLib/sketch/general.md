# General Functionality

This page contains documentation about the "general-functionality" methods of the `Sketch` class. These are mainly the very simple methods and those not belonging to any other obvious class.

```js
import { Sketch } from './Stofflib/sketch.js';
import { Point } from './Stofflib/point.js';
import { Line } from './Stofflib/line.js';
import { Vector } from './Stofflib/geometry.js';
import { ConnectedComponent } from './Stofflib/connected_component.js';
import { default_data_callback } from './Stofflib/copy.js';
type DataCallback : (Object, Object) -> Object;

class Sketch{
    constructor(){
        this.data   : Any = {};
    }
    
    // General Functionality
    get_points(){} : Point[]
    get_lines(){}  : Line[]
    remove_line(line : Line){}
    remove_lines(...lines : Line[]){}
    remove_point(pt : Point){}
    remove_points(...points : Point[]){}
    remove(...els: (Point | Line | ConnectedComponent)[]){}
    clear(){}
    
    add(
        el : Point | Vector | Line , // OR
        x, y : Number 
    ){}  : (Point | Vector | Line)

    has_points(...pt : Point[]){} : Boolean
    has_lines(...ls : Line[]){} : Boolean
    has_sketch_elements(...se : (Point | Line | ConnectedComponent)[]){} : Boolean
    has(...se : (Point | Line | ConnectedComponent)[]){} : Boolean
    
    get_bounding_box(min_bb : Number[2] = [0,0]) : {
        width, height : Number,
        top_left, top_right, bottom_left, bottom_right : Vector
    }
    
    group_by_key(key : Any){} : {
        points: Object
        lines:  Object
    }
    lines_by_key(key : Any){}  : Object
    points_by_key(key : Any){} : Object
    
    copy(){} : Sketch
    paste_sketch(
        sketch : Sketch, data_callback : DataCallback = default_data_callback, position : Vector = null
    ){} : Object

    toString(){} : "[Sketch]"
    validate_sketch(){}

    ...

}
```

To see all methods on one page, see the [introduction page](introduction.md)

# Methods

### Get Points
`.get_points(){} : Point[]`

Returns the points of the Sketch.

```js
const s = new Sketch();
s.point(2,3);
s.point(5,1);
console.log(s.get_points());
```

### Get Lines
`.get_lines(){}  : Line[]`

Returns the lines of the Sketch`

```js
const s = new Sketch();
const p1 = s.point(2,3);
const p2 = s.point(5,1);
s.line_between_points(p1,p2);

console.log(s.get_lines());
```

### Remove Line
`.remove_line(line : Line){}`

Removes a line which belongs to the sketch.

```js
const s = new Sketch();
const p1 = s.point(2,3);
const p2 = s.point(5,1);
const l1 = s.line_between_points(p1,p2);

s.remove_line(l1);
```

This methods throws an error if the line doesn't belong to this sketch. It also throws if the element is anything other than a line. 
This also means that you can't remove the same line twice from the sketch without an error. Note that the endpoints of the line are then set to 0.

### Remove Lines
`.remove_lines(...lines : Line[]){}`

Removes several lines which belong to the sketch. Applies `.remove_line` several times.

```js
...
s.remove_lines(l1, l2, l3);
```

### Remove Point
`.remove_point(pt : Point){}`

Removes a point which belongs to the sketch. Throws an error if the point doesn't belong to the sketch.
All lines adjacent to that point are also removed from the sketch. Note that the enpoints of the lines removed from the sketch in that way are set to `null`.

```js
const s = new Sketch();
const p1 = s.point(2,3);
s.remove_point(p1);
```

This methods throws an error if the point doesn't belong to this sketch. It also throws if the element is anything other than a point. 
This also means that you can't remove the same point twice from the sketch without an error.

### Remove Points
`.remove_points(...points : Point[]){}`

Removes several points which belong to the sketch. Applies `.remove_point` several times

```js
...
s.remove_points(p1, p2, p3)
```

### Remove
`.remove(...els: (Point | Line | ConnectedComponent)[]){}`

Calls for each possible argument type the corresponnding remove method. Throws if argument doesn't belong to sketch.

```js
...
s.remove(l1,l2,p1,cc1)
```

### Clear
`.clear(){}`

Clears / Resets the current sketch, removing all points and lines and setting its data to `{}`. May be usefull if you don't want to mess up references.

```js
const s = new Sketch();
s.add(3,2);
s.clear();
```

### Add
```js
.add(
    el : Point | Vector | Line , // OR
    x, y : Number 
){}  : (Point | Vector | Line)
```

Adds the element to the sketch via the element specific method. Then returns it. Note that you can input a `Vector` or a position `x, y` to create a point in the sketch.

If you add a `Line` then the endpoints must already be inside the Sketch and you must relate them to each other before adding the `Line to the Sketch`. In almost all usecases you want to avoid this.

```js
const s = new Sketch();
s.add(3,2);
s.add(new Vector(3,2));
```

### Has Points
`.has_points(...pt : Point[]){} : Boolean`

Returns a boolean whether all arguments are points which belong to a sketch.

```js
import { Point } from "./StoffLib/point.js";
const s = new Sketch();
s.has_points(new Point(1,2), null); // False
const p1 = s.add(2,2);
const p2 = s.add(2,3);
s.has_points(p1, p2); // True
```

### Has Lines
`.has_lines(...ls : Line[]){} : Boolean`

Returns a boolean whether all arguments are lines which belong to a sketch.

```js
...
const l1 = s.line_between_points(p1,p2);
s.has_lines(l1); // True
s.has_lines(p1, l1); // False
```

### Has Sketch Elements
`.has_sketch_elements(...se : (Point | Line | ConnectedComponent)[]){} : Boolean`

Returns a boolean whether all arguments belong the the sketch. Passing a connected component check whether the root is inside that sketch. See [here](#) for more of connected components.

### Has
`.has(...se : (Point | Line | ConnectedComponent)[]){} : Boolean`

Alias for `.has_sketch_elements`

### Get Bounding Box
```js
.get_bounding_box(min_bb : Number[2] = [0,0]) : {
    width, height : Number,
    top_left, top_right, bottom_left, bottom_right : Vector
}
```

Returns the bounding box of the sketch. 

If you set `min_bb`, then the width and height of the bounding box returned are the maximum of the actual computed once and `min_bb[0]` and `min_bb[1]` respectively. You may want to use this for rendering purposes. Note however that then this information becomes incosistent with the corner vectors, since those aren't changed. If no points are present, all corner vectors are `new Vector(0,0)`.

### Group By Key
```js
.group_by_key(key : Any){} : {
    points: Object
    lines:  Object
}
```

Returns the points and lines of the sketch grouped by a key in their data object. This is the same as

```js
{
    points: s.points_by_key(key),
    lines: s.lines_by_key(key)
}
```

which are further explained here:

### Lines By Key
`.lines_by_key(key : Any){}  : Object`

Lines (and points) have like sketches an intended data object for information storage. If you have a consistent naming convention or classification via attributes of this object, you can get your lines grouped by that.
All objects for which the key is not set are grouped together as their own thing:

```js
!TODO
```

### Points By Key
`.points_by_key(key : Any){} : Object`

Returns the points of the sketch grouped be a key in their data object. This works analogous to `s.lines_by_key(key)`.
    
### Copy
`.copy(){} : Sketch`

Returns a copy of the sketch. The data attribute of the sketch as well as the points are all copied (not rereferenced.)
The references in these attributes are updated accordingly.

### Paste Sketch
```js
.paste_sketch(
    sketch : Sketch,
    data_callback : DataCallback = default_data_callback,
    position : Vector = null
){} : Object
```

Copies the argument sketch into the sketch you call the method on. `data_callback` tells you how to update the data object
of the target sketch. See more on copying [here.](#)
`position` tells you where the top left corner of the bounding box of the old sketch should be located in the new sketch. If it is `null`, it will default to be exactly the top left corner.

Returns the new data object of the target sketch.

### To String
`s.toString(){} : "[Sketch]"`

Returns `"[Sketch]"`, required to JSON serialization.



### Validate Sketch
`s.validate_sketch(){}`

Validates expected constraints of the sketch are present, like all points of the sketch having `Number` coordinates and know that they belong to the sketch.
See [here](#) for more on validation && the arising errors.

This method is by default called after every method mutating the sketch, like an assert.