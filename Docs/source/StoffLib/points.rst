Points
==========

**Source File**: ./StoffLib/point.js

.. js:class:: Point

 ``class Point extends Vector``
 A point inside a sketch.

 **Constructor**:

 .. js:function:: constructor(x, y)
    
  **Parameters**:
   - x (*number|Vector*): x-position
   - y (*number*): y-position
  
   Alternatively x can also be a vector and we then use its position.

 **Attributes**:

 .. js:attribute:: adjacent_lines
 
     An array of the lines adjacent to this point in its sketch.
 
     **Type**: []Line
 
 .. js:attribute:: sketch

    The sketch the point belongs to (this is set when adding a point to a sketch.)
    Note that many methods don't make sense when the point doesn't belong to a sketch.

    **Type**: Sketch
 
    **Default**: null
 
 .. js:attribute:: attributes
 
     Rendering attributes, based in svg rendering attributes. You probably don't want to modify this directly.
 
     **Type**: object
 
     **Default**:
    
     .. code-block:: javascript

        {
            fill: color,
            radius: 3,
            stroke: "black",
            strokeWidth: 1,
            opacity: 1
        }
 
 .. js:attribute:: data
 
     A data attribute that you can use to associate custom data to the point which :doc:`behaves well under copying <todo>` and is also used for referencing specific points, see the :doc:`sketch methods. <sketch>` 
 
     **Type**: object
 
     **Default**: {}



 **Methods**:

 .. js:function:: vector()
     
  Returns a vector with the same coordinats as the point.
 
  **Returns**:
    - *Vector*
  
 .. js:function:: connected_component()
     
  Same as ``new ConnectedComponent(this)``, see :doc:`ConnectedComponent <connected_component>`.
 
  **Returns**:
    - *ConnectedComponent*
  
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
  
 .. js:function:: copy()
     
  Returns a point with the same position and rendering attributes. Notably that point isn't yet added to the sketch.
 
  **Returns**:
    - *Point*

 .. js:function:: get_tangent_vector(line)
     
  Returns the tangent vector at ``this`` of the adjacent ``line``. Same as
  ``line.get_tangent_vector(this)``. It is unit length and points away from the line.
 
  **Parameters**:
    - line (*Line*): An adjacent line
 
  **Returns**:
    - *Vector*
  
 .. js:function:: get_adjacent_line(line)
     
  Returns the single adjacent line, null or an error.

  **Returns**:
    - *Line|null*

 .. js:function:: get_adjacent_lines()
     
  Returns the adjacent_lines
 
  **Returns**:
    - *[]Line*
  
 .. js:function:: other_adjacent_lines(...lines)
     
  Returns the adjacent lines which are not in the input list.

  Same as ``this.adjacent_lines.filter(l => lines.indexOf(l) < 0)``

  **Parameters**:
    - ...lines (*[]Line*)
 
  **Returns**:
    - *[]Line*
  
 .. js:function:: other_adjacent_line(...lines)
     
  Almost the same as ``this.other_adjacent_lines(...lines)[0] || null``.
  But if there at least two adjacent lines not in the given list, it throws an error.
 
  **Parameters**:
    - ...lines (*[]Line*)
 
  **Returns**:
    - *[]Line*
  
 .. js:function:: common_line(point)
     
  Returns the single common line betwee this and the given point.
 
  **Parameters**:
    - point (*Point*): The other point
 
  **Returns**:
    - *Line|null*

 .. js:function:: common_lines(point)
     
  Returns a list of all lines common betweehn this and the given points.
 
  **Parameters**:
    - point (*Point*): The other point
 
  **Returns**:
    - *[]Line*
  
 .. js:function:: move_to(x,y)
     
  Moves the point to the position
 
  **Parameters**:
    - x (*number*)
    - y (*number*)
 
  **Returns**:
    - this
  
 .. js:function:: offset_by(x,y=null)
     
  Offsets the point by x,y (or a vector inside ``x``.)

  **Parameters**:
    - x (*number|Vector*)
    - y (*number|null*)
 
  **Returns**:
    - this
  
 .. js:function:: remove()
     
  Removes the line from its sketch.

 .. js:function:: has_lines(..ls)
     
  Returns a boolean whether this point has all the lines as adjacent lines.
 
  **Parameters**:
    - ls (*[]Line*)
 
  **Returns**:
    - *boolean*

 **Static**:
  
 .. js:function:: static.from_vector(vec)
      
  Returns a point at the same position of the vector.
  
  **Parameters**:
   - vec (*Vector*)
  
  **Returns**:
   - *Point*
   
  
    