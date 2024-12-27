# `SewingSketch.glue(<>)`

This method glues together two connected components of the sketch along a shared line (or just two pairs of points). In generell it has 2 modes:

- With fixed point: The ("restricted") connected components have exactly one point in common. (Imagine two triangles with a shared point.) Then we can glue along a line by rotating one triangle so that two lines meet and then merge them.
- Without fixed point: If we have two properly disconnected connected components, we can glue them together by moving one so that the specified points overlap with the specified points of the other.

## Signature
There are several ways to call this method:

```js
sketch.glue([p1, p2], [q1, q2] : [2]Point, data) : out
sketch.glue(line1, line2 : Line, data) : out
// Any combination of the above
```

If lines are given, then they are converted to an array of their endpoints.
If two points between the array agree they are seen as the fixed point and the other two are merged together. If they are 4 distinct points, then `p1` glues to `q1` and `p2` glues to `q2`.
In any case, the connected component of the first points stays stationary, the other gets moved/ rotated.

Additionally you can set the optional `data` attribute, an object. It can have the following keys:

```js
data = {
    points: "merge", // or:  "delete", "delete_both", callback
    lines:  "delete" // or:  "keep", "merge", callback
    anchors: "keep"  // or:  "delete"
}
```

The actually set key there is the default. The keys do the following:

#### data.points
What to do with the one (or two) points to glue. The possible keys are

- `callback`: A sketch data callback. It will be used for merging the points to glue.
- `"merge"`: Sets the callback for merging to the `default_data_callback`
- `"delete"`: Deletes all glue points (notably not the fixed point) see below to see what happens to the adjacent lines.
- `"delete_both"`: Deletes all glue points (and, if existing, the fixed point) 

#### data.lines, no points deleted
When not points are deleted this is about what happens to the lines connecting the glue points. The possible options are:

- `"delete"`: Delete all line between `p1` and `p2` as well as `q1` and `q2` respectively
- `"keep"`: Keep all lines between the specified points
- `callback`: Both `p1`, `p2` and `q1`, `q2` can have at most one Line between them. But at least one pair of them must have a line. The are merged using the callback.
- `"merge"`: Glue the lines using the `default_data_callback`

#### data.lines, some points deleted
When some points are deleted this is about what happens to the lines adjacent to the glue points. We expact that each (deleted) glue point has at most two adjacent lines to it, other than the glue line.
If there are two, they are merged using the callback. If there are one it just gets deleted.

- `callback`: Both `p1`, `p2` and `q1`, `q2` can have at most one Line between them. But at least one pair of them must have a line. The are merged using the callback.
- `<anything_else>`: Use `default_data_callback`

#### data.anchors
Whether to keep anchors after glueing. (It may interfier with deleting glue points when not.)

- `"delete"`: Deletes all anchors
- `"keep"`: Keeps all anchors

## Errors
This errors, when anything unreasonable is put it. Maybe the points dont belong to the same connected component. Or you try something like glueing two lines of a triangle together.

## Notes

When using data callbacks, whenever two points (or, seperately, lines) are merged, then the same callback is used. Look at the docs for the callback to see how to figure out in the callback which particular things we merge.
When gluing lines (without deleting points) the orientation of the first lines is used. When glueing with deleting points it is not really save to deduce which orientation the glues lines have, as this depends on the order how they are stored in the `sketch` object.
You can use anchors (`SewingSketch.anchor(<>)`) to rotate the correct things along the main connected component when glueing.