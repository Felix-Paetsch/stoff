Sketch
==========

A sketch is a place where you draw lines and point to be eventually rendered to
an svg, jpg or copied to another sketch. You may want to do all your constructions one one sketch,
however for complicated situations you may want to seperate concerns onto different sketches and then
merge them together.

**Source File**: ./StoffLib/sketch.js

.. js:class:: Sketch

 **Constructor**:

 .. js:function:: constructor()

 **Attributes**:

 .. js:attribute:: points
 
     An array of points belonging to the sketch.
 
     **Type**: []Point

 .. js:attribute:: lines
 
     An array of lines belonging to the sketch.
 
     **Type**: []Line
 
 .. js:attribute:: data
 
     A data attribute that you can use to associate custom data to the sketch which :doc:`behaves well under copying <todo>`, see the :doc:`sketch methods. <sketch>` 
 
     **Type**: object
 
     **Default**: {}

 **Methods**:

 .. js:function:: point(x,y)
     
  Adds the point ``new Point(x,y)`` to the sketch.
  
  **Parameters**:
   - x (*number|Vector*): x-position
   - y (*number*): y-position

  **Returns**:
   - *Point*

 .. js:function:: add_point(...args)
     
  Adds a point (if a point is given) to the sketch or creates a new point on the sketch.
  
  **Parameters**:
   - *[Point]*: Adds the point to the sketch
   - *[Vector]*: Creates a new point at that position on the sketch
   - *[x:number, y:number]*: Creates a new point at that position on the sketch

  **Returns**:
   - *Point*

 .. js:function:: add_line(line)
     
  Adds a a line to the sketch. The endpoints must already be part of the sketch.
  
  **Parameters**:
   - *Line* the line to add

  **Returns**:
   - *Line*
  
 .. js:function:: add(...args)
     
  Either calls ``this.add_point`` or ``this.add_line``
  
  **Parameters**:
   - *[Point]*: Adds the point to the sketch
   - *[Vector]*: Creates a new point at that position on the sketch
   - *[x:number, y:number]*: Creates a new point at that position on the sketch
   - *[Line]*: Adds the line to the sketch.

  **Returns**:
   - *Point|Line*
  
 .. js:function:: get_points()
 
  Returns the points of the sketch.
 
  **Returns**:
    - *[]Point*
  
 .. js:function:: get_lines()
 
  Returns the lines of the sketch.
 
  **Returns**:
    - *[]Line*
  
 .. js:function:: remove_line(line)
 
  Same as

  .. code-block:: javascript

    this.remove_lines(line)
 
  **Parameters**:
    - line (*Line*): Line to remove
 
  **Returns**:
    - *this*
  
 .. js:function:: remove_point(point)
 
  Same as

  .. code-block:: javascript

    this.remove_points(point)
 
  **Parameters**:
    - point (*Point*): Point to remove
 
  **Returns**:
    - *this*
  
 .. js:function:: remove_lines(...lines)
 
  Removes the lines from the sketch. This also updates correctly for the endpoints which adjacent lines they have.
  You most likely don't want to use a line anymore after you removed it.

  **Parameters**:
    - lines (*[]Line*): Lines to remove
 
  **Returns**:
    - *this*
  
 .. js:function:: remove_point(...points)
 
  Removes the points from the sketch. This also removes all adjacent lines from the sketch.

  **Parameters**:
    - points (*[]Point*): Points to remove
 
  **Returns**:
    - *this*
  
 .. js:function:: remove(...els)
 
  Removes the given elements from the sketch. If a connected component is given we remove every point (hence line) from it.

  **Parameters**:
    - els (*[](Point|Line|ConnectedComponent)*): Stuff to remove
 
  **Returns**:
    - *this*
  
 .. js:function:: transform(pt_fun = (_pt) => {})
 
  Execute a function on every point. May be used for rotation or scaling.

  **Parameters**:
    - pt_fun (*(pt) => none*)
 
  **Returns**:
    - *this*
  
 .. js:function:: mirror(...args)
 
  Mirros all points (and lines) along the line or point given in args. Compare also ``Geometry.mirror_at``

  **Parameters**:
   - args (*Line|Ray|[2]Vector|[1][2]Vector*)
 
  **Returns**:
    - *this*
  
 .. js:function:: clear()
 
  Same as
    
  .. code-block:: javascript
        
        this.points = [];
        this.lines  = [];
        this.data = {};

  You probably only want to use this when you have an abstraction on this library working with only one sketch you inexplicitly access.
 
  **Returns**:
    - *this*
  
 .. js:function:: has_points(...pt)
 
  Returns whether all points belong to the sketch
    
  **Parameters**:
    - pt (*[]Point*)

  **Returns**:
    - *boolean*
  
 .. js:function:: has_lines(...ls)
 
  Returns whether all lines belong to the sketch
    
  **Parameters**:
    - ls (*[]Line*)

  **Returns**:
    - *boolean*
  
 .. js:function:: has_sketch_elements(...se)
 
  Returns whether the lines, points and connected components given belong to the sketch
    
  **Parameters**:
    - se (*[](Point|Line|ConnectedComponent)*)

  **Returns**:
    - *boolean*
  
 .. js:function:: has(...se)
 
  Alias for ``this.has_sketch_elements``.
    
  **Parameters**:
    - se (*[](Point|Line|ConnectedComponent)*)

  **Returns**:
    - *boolean*
  
 .. js:function:: get_bounding_box(min_bb = [0,0])
     
  Returns the bounding box of the sketch. It will have at least width and height specified by ``min_bb`` to deal more easily with edge cases line having only one point.

  **Returns**:

  .. code-block:: javascript

    {
        width:  Number,
        height: Number,
        top_left:     Vector,
        top_right:    Vector,
        bottom_left:  Vector,
        bottom_right: Vector
    }
  
 .. js:function:: convex_hull()
     
  Returns the convex hull of the sketch, see also :doc:`Geometry <geometry>`.
 
  **Returns**:
    - *[]Point*

 .. js:function:: lines_by_key(key)
     
  Returns an object where the keys are ``line.data[key]`` ranging over all lines of the sketch
  and the values are arrays of the lines of the sketch with that value for that key. If a lines data does't have that key,
  then it is interpreted as ``"_"``
 
  **Parameters**:
    - key (*string*)
 
  **Returns**:
    - *object*

 .. js:function:: points_by_key(key)
     
  Same as ``this.lines_by_key`` but for the points.
 
  **Parameters**:
    - key (*string*)
 
  **Returns**:
    - *object*

 .. js:function:: points_by_key(key)
     
  Same as

  .. code-block:: javascript

    {
        points: this.points_by_key(key),
        lines: this.lines_by_key(key)
    }

 
  **Parameters**:
    - key (*string*)
 
  **Returns**:
    - *object*

 .. js:function:: merge_points(pt1, pt2, data_callback = default_data_callback)
     
  Merges the points ``pt1`` and ``pt2`` of the sketch into ``pt1``. For that they have to have the same coordinates.
  To merge the data appropriately, you can use the callback. See :doc:`here <data_callbacks>`.

  **Parameters**:
    - pt1 (*Point*)
    - pt2 (*Point*)
    - data_callback (*DataCallback*)

  **Returns**:
    - *Point*
  
 .. js:function:: copy(el = null)
     
  This method copies ``el`` and returns a reference to it. Points and Lines will be copied into the sketch with the same data at the same position.
  If no argument is given, then this returns a copy of the sketch.

  **Parameters**:
    - el (*null|Line|Point*)
 
  **Returns**:
    - *Sketch|Line|Point*
  
 .. js:function:: paste_sketch(sketch, data_callback = copy_data_callback, position = new Vector(0, 0))
     
  Pastes the ``sketch`` into this sketch at the specified position with a datacallback that will
  be called for each point and line.

  **Parameters**:
    - sketch (*Sketch*)
    - data_callback (*DataCallback*): Will be evaluated for each line and point
    - position (*Vector*): The point ``(0,0)`` of the sketch to be pasted will be moved to that positon before pasting.
 
  **Returns**:
    - *this*
  
 .. js:function:: toString()

  **Returns**:
    - "[Sketch]"
  
 .. js:function:: validate()
     
  Same as 

  .. code-block:: javascript

    assert.IS_VALID(this)

  See :doc:`assert. <assert>`


- Line Functions
- CC Functions
- Rendering Functions