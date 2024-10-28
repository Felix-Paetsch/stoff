# Point Methods

This page contains documentation about the point-related methods of the `Sketch` class.

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

    // Point Methods
    point(x: Number, y: Number){} : Point
    add_point(
        p : Point | Vector          , // OR
        x, y : Number 
    ){} : Point
    merge_points(
        pt1, pt2 : Point,
        data_callback : DataCallback = default_data_callback
    ){} : Point

    ...
}
```

To see all methods on one page, see the [introduction page](introduction.md)

# Methods

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