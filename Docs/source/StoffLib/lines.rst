Line
==========

Note that there is also a (different) line class in :doc:`geometry.js <geometry>`

**Source File**: ./StoffLib/line.js

.. js:class:: Line
 
 A line inside a sketch. Almost always you don't want to construct them directly, but use sketch methods to create them.

 **Constructor**:

 .. js:function:: constructor(endpoint_1, endpoint_2, sample_points, color = "black")
    
  **Parameters**:
   - endpoint_1 (*Point*): One endpoint (going to be ``this.p1``)
   - endpoint_2 (*Point*): Other endpoint (going to be ``this.p2``)
   - sample_points (*[]Vector*): The sample points of the line, see below
  
 **Attributes**:
 
 .. js:attribute:: sketch

    The sketch the line belongs to (this is set when adding a line to a sketch.)
    Note that many methods don't make sense when the line doesn't belong to a sketch.

    **Type**: Sketch
 
    **Default**: null
 
 .. js:attribute:: attributes
 
     Rendering attributes, based in svg rendering attributes. You probably don't want to modify this directly.
 
     **Type**: object
 
     **Default**:
    
     .. code-block:: javascript

        {
            stroke: "black",
            strokeWidth: 1,
            opacity: 1
        }

 .. js:attribute:: data
 
     A data attribute that you can use to associate custom data to the point which :doc:`behaves well under copying <todo>` and is also used for referencing specific points, see the :doc:`sketch methods. <sketch>` 
 
     **Type**: object
 
     **Default**: {}

 .. js:attribute:: p1
 
     The first endpoint. Depending on your level of abstraction you might want to try to not access this property that much. You can get the endpoints you are looking for also often by methods below or on a sketch.
 
     **Type**: Point

 .. js:attribute:: p2
 
     The second endpoint.
 
     **Type**: Point

 .. js:attribute:: sample_points
 
     An array of the sample points for this line. The sample point positions are relative to the endpoints.
     So ``(0,0)`` corresponds to ``this.p1`` and ``(0,1)`` corresponds to ``this.p2``. Furthermore we expect the first point in the array to correspond to ``this.p1`` and the last one to ``this.p2``.

     **Type**: []Point

 **Methods**:

 .. js:function:: offset_sample_points(radius, direction = false)
     
  Returns the (absolute) sample points of the line, offset by ``radius`` in the specified direction.
  This is like tracing out the line with a circle of radius ``radius`` on a plate of sand and taking either
  the top or bottom part of the resulting shape, cut of directly above/below the endpoints.
 
  **Parameters**
    - radius (*number*): Radius of the tracing disc. If negative we swap take the other path
    - direction (*boolean*): Whether to take the top (false) or bottom (true) part of the outlined shape. Here top and bottom are relative to the orientation (``this.p1`` -> ``this.p2``)

  **Returns**:
    - *[]Vector*: The absolute sample points of the resulting path

 .. js:function:: set_endpoints(p1,p2)
     
  Sets the endpoints of the line. This also takes care of telling all involved points whether the line is connected to them. 
 
  **Parameters**
    - p1 (*Point*)
    - p2 (*Point*)

  **Returns**
    - *this*

 .. js:function:: remove()
     
  Removes the line from its sketch. Throws if it doesn't belong to any.

 .. js:function:: other_endpoint(pt)
     
  Returns the other endpoint of the line. Throws if ``pt`` is not an endpoint of the line.
 
  **Parameters**
    - pt (*Point*)
  
  **Returns**:
    - *Point*


 .. js:function:: has_endpoint(pt)
     
  Same as

  .. code-block:: javascript

    this.p1 == pt || this.p2 == pt;
 
  **Parameters**
    - pt (*Point*)
  
  **Returns**:
    - *boolean*

 .. js:function:: is_deleted()
     
  Same as

  .. code-block:: javascript

    this.sketch == null;

  If you use the library as indended, you shouldn't use lines without a sketch
  (unless perhaps you have just constructed them.)
  
  **Returns**:
    - *boolean*



 .. js:function:: set_changed_endpoint(p1, p2)
     
  Expects (at least) one of the points already be an endpoint of the line.
  This methods set the other endpoint to the other point. E.g. if ``this.p1 == p1`` then it sets ``this.p2 = p2``.
  You might want to use this function instead of ``this.set_endpoints`` to preserve orientation.

  **Returns**:
    - *this*

 .. js:function:: replace_endpoint(p1, p2)
     
  Expects ``p1`` to already be an endpoint of this. Then replaces that endpoint by ``p2``.

  **Returns**:
    - *this*

 .. js:function:: replace_endpoint(p1, p2)
     
  Expects ``p1`` to already be an endpoint of this. Then replaces that endpoint by ``p2``.

  **Returns**:
    - *this*

 .. js:function:: set_color(color)
 
  **Parameters**:
    - color (*string*)
 
  **Returns**:
    - this
  
 .. js:function:: get_color()

  **Returns**:
    - *string*
  
 .. js:function:: set_attribute(attr, value)
     
  Sets a rendering attribute, same as

  ``this.atrributes[attr] = value``.

  Later this might be used to unify the terminology for setting the same attribute on lines and points.
 
  **Parameters**:
   - attr (*string*)
   - value (*string*)
 
  **Returns**:
    - this
  
 .. js:function:: get_sample_points()
     
  Returns a reference to the lines (relative) sample points.
 
  **Returns**:
  - *[]Vector*
  
 .. js:function:: copy_sample_points()
     
  Returns a copy of the lines (relative) sample points.
 
  **Returns**:
  - *[]Vector*
  
 .. js:function:: is_straight()
     
  Returns whether the line is straight (doesn't mean it has to be an instance of ``StraightLine()``.)
 
  **Returns**:
  - *boolean*
  
 .. js:function:: is_convex()
     
  Returns whether the line is (not neccessarily strictly) convex.
 
  **Returns**:
  - *boolean*

 .. js:function:: connected_component()
     
  Same as ``new ConnectedComponent(this)``, see :doc:`ConnectedComponent <connected_component>`.
 
  **Returns**:
    - *ConnectedComponent*
  
 .. js:function:: get_to_relative_function()
     
  Returns a function to transform absolute coordinates to relative coordinates (angle preserving, with ``this.p1`` becoming ``(0,0)`` and ``this.p2`` becoming ``(1,0)``)
 
  **Returns**:
  - *(Vector) => Vector*
  
 .. js:function:: get_to_absolute_function()
     
  Returns a function to transform relative coordinates to absolute coordinates (angle preserving, with ``(0,0)`` becoming ``this.p1`` and ``(1,0)`` becoming ``this.p2``)
 
  **Returns**:
  - *(Vector) => Vector*
  
 .. js:function:: vec_to_absolute(vec)
     
  Same as
 
  .. code-block:: javascript

    this.get_to_absolute_function()(vec)

  **Returns**:
  - *Vector*
  
 .. js:function:: get_absolute_sample_points(vec)
     
  Returns the sample points with their absolute position. (Note this is not a reference to anything used internally.)

  **Returns**:
  - *[]Vector*
  
 .. js:function:: get_line_vector(vec)
     
  Same as

  .. code-block:: javascript

    this.p2.subtract(this.p1)

  **Returns**:
  - *Vector*
  
 .. js:function:: get_endpoints(vec)
     
  Same as

  .. code-block:: javascript

    [this.p1, this.p2];

  **Returns**:
  - *[2]Vector*

 .. js:function:: orientation(p1, p2 = null)
     
  ``p1`` and if given ``p2`` are assumed to be endpoints of the line.
  Returns $\\pm 1$ depending on whether ``p1 == this.p1``.
  This method is indended to make calculations/constructions independend of which endpoint is ``this.p1`` and which ``this.p2``

  **Returns**:
  - *+1|-1*

 .. js:function:: same_orientation(p1, p2 = null)
     
  ``p1`` and if given ``p2`` are assumed to be endpoints of the line. Then its the same as

  .. code-block:: javascript

    this.p1 == p1

  **Returns**:
  - *boolean*
  
 .. js:function:: get_tangent_line(pt)
     
  Returns the tangent line to ``pt`` along the curve.
 
  **Parameters**:
   - pt (*vector*)
 
  **Returns**:
    - *Geometry.Line*
  
 .. js:function:: get_tangent_line(pt)
     
  Returns the tangent vector to ``pt`` along the curve.
  It will point from ``this.p1`` to ``this.p2`` unless you explicitly put there in, then they point outward.
 
  **Parameters**:
   - pt (*vector*)
 
  **Returns**:
    - *Geometry.Line*
  
 .. js:function:: mirror(direction = false)
     
  Mirrors the line perpendicular to the endpoints (``direction = false``) or such that the endpoints are swapped (``direction = true``).
  Note that in the later case also ``this.p1`` and ``this.p2`` swap. 

  **Returns**:
    - *this*
  
 .. js:function:: swap_orientation()
     
  Swaps ``this.p1`` and ``this.p2`` without changing how the line looks from the outside.
  I.e. also reversing the sample points and adjusting their positions correctly. 

  **Returns**:
    - *this*
  
 .. js:function:: stretch(factor = 1)
     
  Stretches the sample points perpendicular to the direction ``this.p1 -> this.p2``.

  **Returns**:
    - *this*
  
 .. js:function:: endpoint_distance()
     
  Returns the distance between the endpoints. Same as

  .. code-block:: javascript

    this.p1.distance(this.p2);

  **Returns**:
    - *number*

 .. js:function:: get_length()
     
  Returns the length of the line.

  **Returns**:
    - *number*

 .. js:function:: get_bounding_box()
     
  Returns the bounding box of the curve. It looks like:

  .. code-block:: javascript

    {
        width:  Number,
        height: Number,
        top_left:     Vector,
        top_right:    Vector,
        bottom_left:  Vector,
        bottom_right: Vector
    }

  **Returns**:
    - *object*

 .. js:function:: convex_hull()
     
  Same as

  .. code-block:: javascript

    Geometry.convex_hull(this.get_absolute_sample_points());

  **Returns**:
    - *[]Vector*

 .. js:function:: is_adjacent(thing)
     
  ``thing`` is either a point of line. If it is a point we return whether it is an endpoint of this line.
  If it is a line we return whether they have a point in common.

  **Parameters**
    - thing (*Point|Line*)

  **Returns**:
    - *boolean*

 .. js:function:: common_endpoint(line)
     
  Returns a common endpoint between this line and ``line`` if it exists.

  **Returns**:
    - *Point|null*

 .. js:function:: position_at_length(length, reversed = false)
     
  Returns the vector a certain length along the line. Length has to be at most the lines length.
  If the length is negative that is the same as negating ``reversed``.

  **Parameters**:
    - length (*number*)
    - reversed (*boolean*) whether to take the distance along the curve starting ad ``this.p1`` (*false*) or ``this.p2`` (*true*)

  **Returns**:
    - *Vector*

 .. js:function:: position_at_fraction(f, reversed = false)
     
  Returns the vector a certain fraction ``f`` of the total length along the line.
  If the fraction is negative that is the same as negating ``reversed``.

  **Parameters**:
    - f (*number*)
    - reversed (*boolean*) whether to take the distance along the curve starting ad ``this.p1`` (*false*) or ``this.p2`` (*true*)

  **Returns**:
    - *Vector*

 .. js:function:: closest_position(vec)
     
  Returns the closest position on the line to the specified vector ``vec``.

  **Parameters**:
    - vec (*Vector*)

  **Returns**:
    - *Vector*

 .. js:function:: minimal_distance(vec)
     
  Returns the minimal distance from a line to the specified vector ``vec``.

  **Parameters**:
    - vec (*Vector*)

  **Returns**:
    - *number*

 .. js:function:: set_sketch(s)
     
  Sets the sketch of the line.

  **Parameters**:
    - s (*Sketch*)

  **Returns**:
    - *this*

 .. js:function:: toString()

  **Returns**:
    - *"[Line]"*

 .. js:function:: toJSON()

  **Returns**:
  
  .. code-block:: javascript

    {
      p1: [this.p1.x, this.p1.y],
      p2: [this.p1.x, this.p1.y],
      sample_points: this.sample_points.map(p => [p.x, p.y])
    }

 .. js:function:: self_intersects()
  
  Returns whether the line self-intersects. This currently is somewhat slow.. to be improved.
  Most likely you don't want lines self-intersecting.

  **Returns**:
    - *boolean*

 **Dev methods**

 Dev methods are things which shouldn't be used in production but can be helpful for development,
 perhaps integrated with the surrounding environment and breaking if changing that.

 .. js:function:: dev.mark_endpoints()
     
  Marks the line and its endpoints in the sketch, by setting rendering attributes.


.. js:class:: StraightLine
 
 ``class StraightLine extends Line``
 A straight line inside a sketch. Same functionality as ``class Line`` but faster implementations.

 **Constructor**:

 .. js:function:: constructor(endpoint_1, endpoint_2, density)
    
  **Parameters**:
   - endpoint_1 (*Point*): One endpoint (going to be ``this.p1``)
   - endpoint_2 (*Point*): Other endpoint (going to be ``this.p2``)
   - density (*number*): How tightly the sample points should be spaces. There will be ``Math.ceil(1 / density)`` line segments.
  