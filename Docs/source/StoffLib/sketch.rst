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
  
 .. js:function:: line_between_points(pt1, pt2)
     
  Creates a straight line betweeh the two points on the sketch.

  **Parameters**:
    - pt1 (*Point*)
    - pt2 (*Point*)
 
  **Returns**:
    - *StraightLine*
  
 .. js:function:: line_with_length(pt1, pt2, length)
     
  Creates a cubic spline with two parts and a certain total length between ``pt1`` and ``pt2``.
  Later there is the posibility to have more control on how the line will look like, like setting the slope at the endpoints. (Probably not resulting in a cubic anymore.)

  **Parameters**:
    - pt1 (*Point*)
    - pt2 (*Point*)
    - length (*number*)
 
  **Returns**:
    - *Line*

  
 .. js:function:: line_at_angle(point, angle, length, reference = Geometry.UP)
     
  Creates a straight line on the sketch, starting at ``point`` with the specified angle (rad) rotated clockwise starting from the reference direction.
 
  **Parameters**:
    - pt1 (*Point*)
    - angle (*number*)
    - length (*number*)
    - reference (*Vector*)
 
  **Returns**:
    - *object*

    .. code-block:: javascript

      {
      	line: StraightLine,
        other_endpoint: Point
      }
  
 .. js:function:: line_from_function_graph(pt1, pt2, f_1, f_2 = null)
     
  Creates a line ``pt1`` and ``pt2`` based either on a function graph (``f_2 = null``) or a parametric curve.
  The (relative) sample point of the line between ``pt1`` and ``pt2`` will either be

  ``(t, f_1(t))`` or ``(f_1(t), f_2(2))``

  or if ``f_1`` returns an array, it just plots ``(f_1(t)[0], f_2(t)[0])``

  With ``t`` going from ``0`` to ``1`` and the sample point angle preserving affinely transformed such that the first sample point becomes ``pt1`` and the last ``pt2``
  
  **Parameters**:
    - pt1 (*Point*)
    - pt2 (*Point*)
    - f_1 (*(number) => number*)
    - f_2 (*null|((number) => number)*)
 
  **Returns**:
    - *Line*
  
 .. js:function:: interpolate_lines(line1, line2, direction = 0, f = (x) => x, p1 = (x) => x, p2 = (x) => x)
     
  Interpolates two lines.

  ``(t, f_1(t))`` or ``(f_1(t), f_2(2))``

  With ``t`` going from ``0`` to ``1`` and the sample point angle preserving affinely transformed such that the first sample point becomes ``pt1`` and the last ``pt2``
  
  **Parameters**:
    - line1 (*Line*)
    - line2 (*Line*)
    - direction (*0|1|2|3*): In which direction to traverse each line (by default p1 to p2; 1 and 3 change that for the first line, 2 and 4 for the second one)
    - f (*(number)=>number*): At each point in time, how much of the first line and how much of the second line to take.
    - p1 (*(number)=>number*): At each point in time, how far along the first line to take a point for the interpolation.
    - p2 (*(number)=>number*): At each point in time, how far along the second line to take a point for the interpolation.
 
  All functions will be affine linearly normalized to start at 0 and end at 1.

  **Returns**:
    - *Line*

 .. js:function:: merge_lines(line1, line2, delete_join = false, data_callback = default_data_callback)
     
  Merges the two lines at their given endpoint. (And deletes the originals.)
  To merge the data appropriately, you can use the callback. See :doc:`here <data_callbacks>`.

  **Parameters**:
    - line1 (*Line*)
    - line2 (*Line*)
    - delete_join (*boolean*): Whether to delete the point we merged the lines at.
    - data_callback (*DataCallback*)

  **Returns**:
    - *Line*

 .. js:function:: point_on_line(pt, line, data_callback = default_data_callback)
     
  We assume the point is spacily positioned above the line. We split the line up at that positon to create two line segments,
  each connected to the point. If ``pt`` is a plain vector, we first make it a point.

  **Parameters**:
    - pt (*Point*)
    - line (*Line*)
    - data_callback (*DataCallback*)
 
  **Returns**:
    - *object*

    .. code-block:: javascript

      {
      	line_segments: [2]Line,
        point: pt
      } 

 .. js:function:: split_line_at_length(line, length, data_callback = default_data_callback, reversed = false)
     
  Creats a point at ``length`` (abolute) units along the line and then calls ``this.point_on_line()`` on it.
  If reversed is set to false xor length is negative we take the length from the end of the line rather than the beginning. 

  **Parameters**:
    - line (*Line*)
    - length (*number*)
    - data_callback (*DataCallback*)
    - reversed (*boolean*)
 
  **Returns**:
    - *object*

    .. code-block:: javascript

      {
      	line_segments: [2]Line,
        point: Point
      } 

 .. js:function:: split_line_at_fraction(line, length, data_callback = default_data_callback, reversed = false)
     
  Same as ``this.split_line_at_length`` only the specified length is between ``0`` and ``1`` encoding the fraction of the line where to split.

  **Parameters**:
    - line (*Line*)
    - length (*number*)
    - data_callback (*DataCallback*)
    - reversed (*boolean*)
 
  **Returns**:
    - *object*

    .. code-block:: javascript

      {
      	line_segments: [2]Line,
        point: Point
      } 

 .. js:function:: intersect_lines(line1, line2)
     
  Finds the intersections of the given lines, then splits both of them up into their segments according to these intersection positions.
  The line segments are ordered from ``p1`` to ``p2`` for either line. The intersections positions are ordered by where they appear on the first line.

  **Parameters**:
    - line1 (*Line*)
    - line2 (*Line*)
 
  **Returns**:
    - *object*

    .. code-block:: javascript

      {
        intersection_points: []Point,
        l1_segments: []Line,
        l2_segments: []Line
      }

 .. js:function:: line_with_offset(line, offset, direction = false)
     
  Creates a new line in the sketch by offsetting the given line. Compare also ``Line.offset_sample_points``

  **Parameters**:
    - line (*Line*)
    - offset (*number*): How much to offset the line
    - offset (*boolean*): In which direction to offset the line
 
  **Returns**:
    - *object*

    .. code-block:: javascript

      {
        p1: Point, // The first endpoint of the offsetted, corresponding to `line.p1`
        p2: Point,
        line: Line
      }

 .. js:function:: intersection_positions(line1, line2)
     
  Finds the intersection positions of the two lines, returns them ordered by where they appear on the first line.

  **Parameters**:
    - line1 (*Line*)
    - line2 (*Line*)
 
  **Returns**:
    - *[]Vector*

 .. js:function:: copy_line(line, from = null, to = null, data_callback = copy_data_callback)
     
  Copies a line into a new line between two points.

  **Parameters**:
    - line (*Line*): The line to copy
    - from (*Point*): The first endpoint of the new copied line
    - to (*Point*): The second endpoint of the new copied line
    - data_callback (*DataCallback*)
 
  **Returns**:
    - *Line*

 .. js:function:: connected_component(sketch_el)
     
  Returns the connected component associated to a sketch element.

  **Parameters**:
    - sketch_el (*Line|Point|ConnectedComponent*)
 
  **Returns**:
    - *ConnectedComponent*

 .. js:function:: delete_component(sketch_el)
     
  Deletes the connected component associated to a sketch element. (I.e. removing all points and lines)

  **Parameters**:
    - sketch_el (*Line|Point|ConnectedComponent*)
 
  **Returns**:
    - *this*

 .. js:function:: get_connected_components()
     
  Returns a list of all connected components in the sketch 

  **Returns**:
    - *[]ConnectedComponent*

 .. js:function:: to_svg(width = null, height = null)
     
  Returns the sketch rendered to an svg string.

  **Parameters**:
    - width (*number|null*): The width of the target svg
    - height (*number|null*): The height of the target svg

  If none of width and height are given, we just take the data from the bounding box as width and height.
  If one is given, we scale the other according to the aspect ratio. If both are given, we center the sketch in the svg,
  keeping aspect ratio. 

  **Returns**:
    - *string*

 .. js:function:: to_dev_svg(width = null, height = null)
     
  Returns the sketch rendered to an svg string (see above). The svg elements include extra attributes helpful for debugging.

  **Returns**:
    - *string*

 .. js:function:: save_as_svg(save_to, width = null, height = null)
     
  Saves the sketch to an SVG-file, see above.

  **Parameters**:
    - save_to (*string*)
    - width (*number|null*): The width of the target svg
    - height (*number|null*): The height of the target svg

 .. js:function:: to_png(width = null, height = null)
     
  Renders the sketch to a png.

  **Parameters**:
    - width (*number|null*): The width of the target svg
    - height (*number|null*): The height of the target svg

  If none of width and height are given, we just take the data from the bounding box as width and height.
  If one is given, we scale the other according to the aspect ratio. If both are given, we center the sketch in the svg,
  keeping aspect ratio.
  One unit in the sketch is seen as "1 cm". Compare :doc:`the config <config>`

  **Returns**:
    - *pngBuffer*

 .. js:function:: save_as_png(save_to, width = null, height = null)
     
  Saves the sketch to an PNG-file, see above.

  **Parameters**:
    - save_to (*string*)
    - width (*number|null*): The width of the target svg
    - height (*number|null*): The height of the target svg

 .. js:function:: to_jpg(width = null, height = null)
     
  Renders the sketch to a jpg, compare the png fnctions.

  **Parameters**:
    - width (*number|null*): The width of the target svg
    - height (*number|null*): The height of the target svg

  **Returns**:
    - *jpgBuffer*

 .. js:function:: save_as_jpg(save_to, width = null, height = null)
     
  Saves the sketch to an JPG-file, see above.

  **Parameters**:
    - save_to (*string*)
    - width (*number|null*): The width of the target svg
    - height (*number|null*): The height of the target svg


 .. js:function:: save_as_A4(folder = "string")
     
  Saves the sketch as a collection of A4 pages into the folder

  **Parameters**:
    - folder (*string*)

 **Dev methods**

 Dev methods are things which shouldn't be used in production but can be helpful for development,
 perhaps integrated with the surrounding environment and breaking if changing that.

 .. js:function:: dev.at_url(url, overwrite = null, data = null)
     
  Makes the sketch in its current stage visible under ``url`` (which looks something like ``/test``.)
  By default it disaplys below the sketch the data of the sketch, but if ``data`` it is set, then it will be displayed instead.
  Overwrite determines what to do when we try to put a sketch several times at the same url.

  **Parameters**:
    - url (*string*)
    - overwrite (*null|boolean*): ``false`` will not overwrite, ``true`` will overwrite and ``null`` will throw an error if trying to overwrite.
    - data (*null|object*)

 .. js:function:: dev.to_html(route = "/StoffLib", data = null)
     
  Renders the sketch to an html string. It will have the title ``route``
  By default it disaplys below the sketch the data of the sketch, but if ``data`` it is set, then it will be displayed instead.

  **Parameters**:
    - url (*string*)
    - data (*null|object*)


 .. js:function:: dev.save_as_html(path, title = "/StoffLib", data = null)
     
  Sames the html from ``this.to_html`` in a file.
  
  **Parameters**:
    - path (*string*)
    - title (*string*)
    - data (*null|object*)


 .. js:function:: dev.strict_debug_recording(path, title = "/StoffLib", data = null)
     
  Same as ``this.start_recording`` with more intermediate steps.


 .. js:function:: dev.start_recording(...args)
     
  Starts a recording of the sketch. That means it tracks many operations which happen on the sketch
  inside of an associated ``Recorder object``, you can get by ``.stop_recording``. If you give it args,
  these are then passed to the recorders ``.hot_at_url()`` method, see `here <recording>`

 .. js:function:: dev.stop_recording()
     
  Stops recording on the sketch and returns a ``Recording``, `here. <recording>`

  **Returns**:
    - *Recording*

 .. js:function:: static.dev.global_recording()

  Creates a recording that tracks all global manipulations of sketches.

  **Returns**:
   - *Recording* 