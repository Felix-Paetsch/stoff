Geometry
===============

Geometry is a mostly stand-alone library inside StoffLib. Im only imports ``assert`` from the environment.
It exposes algorithms and classes related to 2D geometry.

**Source File**: ./StoffLib/geometry.js

Classes
--------------------
.. js:class:: Vector

   An object representing a position or direction in 2D-space. All methods leave it unchanged (potentially returning a new vector) unless the opposite is obvious from the name.

   **Constructor**:

    .. js:function:: constructor(x = 0, y = 0, column = true)

        x and y must be proper numbers (e.g. not NaN). Column specifies whether the vector should be a column vector. See ``this.is_column`` for more information.
        Alternatively x can also be a `Vector` in which case we just copy its values.

        **Parameters**
        - x (*number*)
        - y (*number*)
        - column (*boolean*)

   **Attributes**:

    .. js:attribute:: x

        x-position in space, same as ``this[0]``.

        **Type**: number

    .. js:attribute:: y

        x-position in space, same as ``this[1]``.

        **Type**: number

    .. js:attribute:: is_column

        Whether the vector is a column vector. This is mostly irrelevent, but comes into play in ``this.mult(el)``.
        Depending on which oritentations the vectors have, multiplication with other vectors or matricies might have different results.

        **Type**: boolean

    .. js:attribute:: is_row

        Whether the vector is a row vector. Opposite of ``this.is_column``

        **Type**: boolean

   **Methods**:

    .. js:function:: to_array()
    
        **Returns**:
            - *[2]number*: ``[this.x, this.y]``
  
    .. js:function:: set(x, y)
    

        **Parameters**:
            - x (*number|Vector*)
            - y (*number*)
  
        Sets the x and y values. If x is a Vector, we copy its values.

        **Returns**:
            - this


    .. js:function:: dot(vec)
    
        Computes the dot product.

        **Parameters**:
            - vec (*Vector*)

        **Returns**:
        	- *number*
  
    .. js:function:: cross(vec)
    
        Computes the (scalar) cross product.
        this.x * vec.y - this.y * vec.x;

        **Parameters**:
            - vec (*Vector*)

        **Returns**:
        	- *number*

    .. js:function:: distance(el)
        
          Returns the (minimum) distance from the element.
    
          **Parameters**:
              - el (*Geometry.Line|Vector|Ray*): The first argument.
    
          **Returns**:
              - *number*
   
    .. js:function:: equals(vec, eps = Geometry.EPS.MINY)
        
          Returns true if two vectors live at the same position (up to some epsilon).
    
          **Parameters**:
              - vec (*Vector*): The other vector
              - eps (*number*): The maximum distance to consider equal
    
          **Returns**:
              - *boolean*: Whether the points are at the same position
  

    .. js:function:: mult(el)
        
          Multiplies this vector (on the left) with el (to the right).
    
          **Parameters**:
              - el (*number|Vector|Matrix*)
    
          Depending on what ``el`` actually is, we get one of:

          - Vector scaled
          - Dot product (row, column)
          - Outer product (column, row)
          - Pointwise product (row, row), (column, column)
          - Vector

          Where the parenthesis mean the orientation of (this, el) if el is a vector.

          **Returns**:
              - *number|Vector|Matrix*

    .. js:function:: transpose()
        
          Returns a new transposed vector
    
          **Returns**:
              - *Vector*

    .. js:function:: scale(a)
        
          Scales the vector by a scalar
    
          **Parameters**:
              - a (*number*): scalar.
    
          **Returns**:
              - *Vector*

    .. js:function:: invert()
        
          Same as ``this.scale(-1)``
    
          **Returns**:
              - *Vector*

    .. js:function:: to_len(len)
        
          Scales the vector to have a certain length. if the vector is very close to 0 this throws.
    
          **Parameters**:
              - len (*number*)
    
          **Returns**:
              - *Vector*
          
    
    .. js:function:: add(vec)
        
          Adds another vector pointwise
    
          **Parameters**:
              - vec (*Vector*)
    
          **Returns**:
              - *Vector*
          
    .. js:function:: subtract(vec)
        
          Same as ``this.add(vec.scale(-1))``
    
          **Parameters**:
              - vec (*Vector*)
    
          **Returns**:
              - *Vector*
  
    .. js:function:: mirror_at(el, vec2 = null)
        
          Mirrors the point at a Line/Ray/Vector.
    
          **Parameters**:
              - el (*Geometry.Line|Vector|Ray|[2]Vector*)
              - vec2 (*null|Vector*)
    
          If we get a line or ray for el, we just mirror at that. If we get a point and ``vec2`` is not a point, we just mirror at ``el``.
          Otherwise we mirror at the line through ``el`` and ``vec2`` or the vectors of ``el``.

          **Returns**:
              - *Vector*
  
    .. js:function:: project_onto(thing)
        
          Projects onto a Geometry.Line or Ray. If we project onto a ray, we actually project to the corresponding line.
    
          **Parameters**:
              - thing (*Line|Ray*)
    
          **Returns**:
              - *vector*

    .. js:function:: length()
        
          Returns the length of the vector
    
          **Returns**:
              - *number*
          
    .. js:function:: length_squared()
        
          Returns the length of the vector squared.
    
          **Returns**:
              - *number*
        
    .. js:function:: normalize()
        
        Scales the vector to have length 1. If it is to close to 0 it throws an error.
    
        **Returns**:
            - *vector*

    .. js:function:: get_orthogonal()
        
        Returns an orthogonal vector with the same length. (Rotated counterclockwise by 90 degree)
    
        **Returns**:
            - *vector*
        

    .. js:function:: get_orthonormal()
        
        Same as ``this.get_orthogonal().normalize()``
        
        **Returns**:
            - *vector*
    
        

    .. js:function:: toString()
        
        Returns a string representation of the vector.
        
        **Returns**:
            - *string*: ``"[this.x, this.y]"``

    .. js:function:: toJSON()
        
        Same as ``this.to_array()``
    
        **Parameters**:
            - arg1 (*type*): The first argument.
    
        **Returns**:
            - *[2]number*: ``[this.x, this.y]``
        
    .. js:function:: print()
        
        Logs the vector to the console.
    
        **Returns**:
            - this
        
    .. js:function:: rotate(angle, around = ZERO)
        
        Rotates the vector by the ``angle`` around the vector ``around`` (clockwise)
    
        **Parameters**:
            - angle (*number*): Angle in radiants
            - around (*Vector*): What to rotate around
    
        **Returns**:
            - *Vector*
        
    .. js:function:: copy()

        **Returns**:
            - *vector*: A copy of this vector
        
.. js:class:: Matrix

    A 2D-Matrix. Unless otherwise stated all methods don't change the original matrix.

    **Constructor**:

    .. js:function:: constructor(vec1, vec2,column_wise = true)
        
            Initialized the matrix. Depending on ``column_wise`` the given vecs are either becomming columns or rows. (Independed of their orientation.)

            **Parameters**:
            - vec1 (*Vector*)
            - vec2 (*Vector*)
            - column_wise (**boolean**)


   **Attributes**:

    .. js:attribute:: col1
   
         The first column, same as ``this[0]``
   
         **Type**: Vector
    

    .. js:attribute:: col2
   
         The second column, same as ``this[0]``.
   
         **Type**: Vector

    .. js:attribute:: row1
   
         The first row.
   
         **Type**: Vector

    .. js:attribute:: row2
   
         The second row.
   
         **Type**: Vector

   **Methods**:   
        
     .. js:function:: transpose()
       
       Returns the matrix transposed.
   
       **Returns**:
           - *matrix*
  
     .. js:function:: print()
        
        Logs the matrix to the console.

        **Returns**:
            - this

     .. js:function:: scale(a)
        
      Scales the matrix by a scalar
    
      **Parameters**:
          - a (*number*)
    
      **Returns**:
          - *Matrix*
  
     .. js:function:: det()
        
      **Returns**:
          - *number*: The matrix determinant

     .. js:function:: invert()
        
      Returns the matrix inverse, throws if not invertible.
    
      **Returns**:
          - *matrix*

     .. js:function:: add(m)
        
      Adds the matrix ``m`` to this matrix.
    
      **Parameters**:
          - m (*Matrix*)
    
      **Returns**:
          - *Matrix*
      
    
     .. js:function:: mult(el)
        
      Multiplies the element ``el`` to the right of this matrix. Treats all vectors as column vectors.
    
      **Parameters**:
          - el (*Matrix|Vector*)
    
      **Returns**:
          - *Matrix|Vector*
      
    
     .. js:function:: toJSON()
        
      Returns a json representation.
    
      **Returns**:
          - *[2][2]number*: ``[this.col1.toJSON(), this.col2.toJSON()]``
      
    
     .. js:function:: toString()
        
      Returns a string representation.
    
      **Returns**:
          - *string* ``[this.col1.toString(), this.col2.toString()]``
      
    
.. js:class:: Line

   A line through 2 points.

   **Constructor**:

    .. js:function:: constructor(p1, p2)

     **Parameters**:
        
     - p1 (*Vector|[2]Vector*)
     - p2 (*Vector*)

     .. code-block:: javascript

         new Line([p1, p2])
         // is becomes
         new Line(p1, p2)

      

   **Attributes**:

    .. js:attribute:: points
    
        The points the line goes through
    
        **Type**: [2]Vector

   **Methods**:

    .. js:function:: get_orthogonal(at = Zero)
        
      Returns an orthogonal line through the specified point
    
      **Parameters**:
          - at (*Vector*)

      **Returns**:
          - *Line*
      
    .. js:function:: contains(pt, eps = EPS.MODERATE)
        
      Returns whether the point lies on the line (with some tolerance)
    
      **Parameters**:
          - vec (*Vector*)
          - eps (*number*)
    
      **Returns**:
          - *boolean*

    .. js:function:: project(vec)
        
      Returns the closest vector on the line to ``vec``.
    
      **Parameters**:
          - vec (*Vector*)
    
      **Returns**:
          - *Vector*

    .. js:function:: distance(vec)
        
      The minimum distance from vec to the line.
    
      **Parameters**:
          - vec (*Vector*)
    
      **Returns**:
          - *number*

    .. js:function:: mirror_at(...data)
        
      Same as 

      .. code-block:: javascript

        new Line(line.points.map(p => p.mirror_at(...data)));

      Mirrors the line at a point of at a line
    
      **Parameters**:
          - data (*Line|Ray|[2]Vector|[1][2]Vector*): The mirroring data
    
      **Returns**:
          - *Line*
      
    
    .. js:function:: to_line()
        
      Same as ``this.copy()``, used for compatibility with Rays.
    
      **Returns**:
          - *Line*
    
    .. js:function:: copy()
        
      Copies the line (by making a new line through the same vectors)
    
      **Returns**:
          - *Line*
      
    
    .. js:function:: intersect(target)
        
      Returns the intersection with a line, ray or line segment (given by two vectors).
    
      **Parameters**:
          - target (*Line|Ray|[2]Vector*)
    
      **Returns**:
          - *null|Vector*
            

   **Static**:
      
    .. js:method:: static.from_direction(vec, direction)
        
      Returns a line through ``vec`` going in the specified direction
    
      **Parameters**:
          - vec (*Vector*)
          - direction (*Vector*)
    
      **Returns**:
          - *Line*

.. js:class:: Ray

 A ray staring at a certain point in space and going in one direction.

 **Constructor**:

  .. js:function:: constructor(src, direction)
    
    **Parameters**:
        - src (*Vector*)
        - direction (*Vector*)

 **Attributes**:

  .. js:attribute:: src

      **Type**: Vector

  .. js:attribute:: direction
    
      **Type**: Vector

  .. js:attribute:: line

      The line when extending the ray to both sides
    
      **Type**: Line
  
     

 **Methods**:

  .. js:function:: get_orthogonal(at = ZERO)
      
    Same as ``this.line.get_orthogonal(at)``.
  
    **Parameters**:
        - at (*Vector*)
  
    **Returns**:
        - *Line*


  .. js:function:: project(vec)
      
   Same as ``this.line.project(vec)``.
  
   **Parameters**:
    - vec (*Vector*)
  
   **Returns**:
    - *Vector*
     
   .. js:function:: contains(vec, eps = EPS.MODERATE)
       
     Returns whether the ray contains the vector with a certain tolerance.
   
     **Parameters**:
         - vec (*Vector*)
         - eps (*number*)
   
     **Returns**:
         - *boolean*

   .. js:function:: distance(vec)
        
    The minimum distance from vec to the ray.
    
    **Parameters**:
     - vec (*Vector*)
    
    **Returns**:
     - *number*
     
   .. js:function:: mirror_at(...data)
       
    Mirrors the ray at ``data`` by mirroring both the line and the direction. Same as
   
    .. code-block:: javascript

        Ray.from_points(this.src.mirror_at(...data), this.src.add(this.direction).mirror_at(...data));

    **Parameters**:
     - data (*Line|Ray|[2]Vector|[1][2]Vector*): The mirroring data
    
    **Returns**:
     - *Line*

   .. js:function:: to_line()
       
    Same as

    .. code-block:: javascript

        Line.from_direction(this.src, this.direction);

    **Returns**:
      - *Line*

   .. js:function:: intersect(target)
        
    Returns the intersection with a line, ray or line segment (given by two vectors).
    
    **Parameters**:
      - target (*Line|Ray|[2]Vector*)
    
    **Returns**:
      - *null|Vector*

   .. js:function:: rotate(angle)
       
    Same as

    .. code-block:: javascript

        new Ray(this.src, this.direction.rotate(angle));
       
    Rotates the ray
   
    **Parameters**:  
     - angle (*number*)
   
    **Returns**:
     - *Ray*
      
 **Static**:
      
  .. js:method:: static.from_direction(src, passing)
    
   Returns a ray starting at src, going through passing. 

   **Parameters**:
    - vec (*Vector*)
    - passing (*Vector*)

   **Returns**:
    - *Ray*
    
      
Static Objects
----------------

.. code-block:: javascript

    export const ZERO = new Vector(0,0);
    export const UP = new Vector(0,-1);
    export const LEFT = new Vector(-1,0);
    export const RIGHT = new Vector(1,0);
    export const DOWN = new Vector(0,1);

    export const VERTICAL = new Line(UP, DOWN);
    export const HORIZONTAL = new Line(LEFT, RIGHT);

EPS
---------------

.. code-block:: javascript

    export const EPS = {
        MINY: 1e-16,
        TINY: 1e-14,

        STRICT_EQUAL: 1e-12,
        EQUAL: 1e-9,
        WEAK_EQUAL: 1e-8,

        FINE: 1e-8,
        FINE_SQUARED: 1e-14,

        MEDIUM: 1e-7,
        MEDIUM_SQUARED: 1e-14,

        MODERATE: 1e-6,
        MODERATE_SQUARED: 1e-12,

        COARSE: 1e-5,
        COARSE_SQUARED: 1e-10,

        LOOSE: 1e-4,
        LOOSE_SQUARED: 1e-8,

        VISUAL: 1e-3
    }

Algorithms
-------------

Note that we assume all angles are given in radiants.

.. js:function:: mirror_type(...data)
    
 Some methods like ``Point.mirror_at(...data)`` mirror either at a line or at a point for any given data.
 This tells you which one it is.

 **Parameters**:
   - ...data (*Line|Ray|[2]Vector|[1][2]Vector*)

 **Returns**:
   - *"Line"|"Point"*
 

.. js:function:: triangle_data(triangle)
    
 Given some data of a triangle you get the other data computed. The input/output data looks like:

 .. code-block:: javascript

    {
        a : number,
        b : number,
        c : number,
        alpha : number,
        beta : number,
        gamma : number
    }

 If you want to get the triangles from the ``SSA`` case, then you can give the ``triangle`` argument the additional key ``SSA``.
 If set to true (default) it will take the triangle of the possible two with the longer side, otherwise the smaller one.

.. js:function:: distance_from_line_segment(endpoints, vec)
     
 Returns the distance of ``vec`` from the line segment specified by ``endpoints``.
 
 **Parameters**:  
  - endpoints (*[2]Vector*): The line segment endpoints
  - vec (*Vector*)
 
 **Returns**:
  - *number*
  
.. js:function:: closest_vec_on_line_segment(endpoints, vec)
     
 Returns closest vector to ``vec`` on the line segment specified by ``endpoints``.
 
 **Parameters**:  
  - endpoints (*[2]Vector*): The line segment endpoints
  - vec (*Vector*)
 
 **Returns**:
  - *Vector*
  
.. js:function:: line_segments_intersect(l1, l2)
     
 Returns the intersection position of two line segments (if any.)
 
 **Parameters**:  
  - l1 (*[2]Vector*)
  - l2 (*[2]Vector*)
 
 **Returns**:
  - *[boolean, Vector]*: The boolean is true if they intersect and the intersection is the Vector. Else the boolean is false.


   
.. js:function:: matrix_from_input_output(f_in, f_out)
     
 Returns the matrix that transforms the vectors from f_in to the vectors in f_out
 
 **Parameters**:  
  - f_in (*[2]Vector*)
  - f_in (*[2]Vector*)
 
 **Returns**:
  - *Matrix*
  
.. js:function:: affine_transform_from_input_output(f_in, f_out)
     
 Returns an angle preserving affine transformation that transforms the vectors from f_in to the vectors in f_out.
 
 **Parameters**:  
  - f_in (*[2]Vector*)
  - f_in (*[2]Vector*)
 
 **Returns**:
  - *(Vector) => Vector*
  
.. js:function:: orthogonal_transform_from_input_output(v1, v2)
     
 Returns an angle preserving linear transformation that maps v1 to v2.
 
 **Parameters**:  
  - v1 (*Vector*)
  - v2 (*Vector*)
 
 **Returns**:
  - *(Vector) => Vector*


.. js:function:: rotation_fun(rotation_vec, angle)
     
 Returns function that takes in a vector and rotates it ``angle`` clockwise around ``rotation_vec``
 
 **Parameters**:  
  - rotation_vec (*Vector*)
  - angle (*number*)
 
 **Returns**:
  - *(Vector) => Vector*


.. js:function:: vec_angle(vec1, vec2, reference = ZERO)
     
 Computes the smaller angle in radiants [vec1 -> reference -> vec2], i.e. the sameller of the two angles between
 (vec1 - reference) and (vec2 - reference).
 
 **Parameters**:  
  - vec1 (*Vector*)
  - vec2 (*Vector*)
  - reference (*Vector*)

 **Returns**:
  - *number* : 0 to PI

.. js:function:: vec_angle_clockwise(vec1, vec2, reference = ZERO, offset_range = false)
     
 Computes the clockwise angle between
 (vec1 - reference) and (vec2 - reference).
 
 **Parameters**:  
  - vec1 (*Vector*)
  - vec2 (*Vector*)
  - reference (*Vector*)
  - offset_range (*boolean*) : Determines if we return from the range [-PI, PI] (false, default) or [0, 2*PI] (true)
 
 **Returns**:
  - *number*

.. js:function:: orientation(vec1, vec2, vec3)

 Returns 1 or -1 depending on whether the points are oriented clockwise or counter clockwise in the plane.
 
 **Parameters**:  
  - vec1 (*Vector*)
  - vec2 (*Vector*)
  - vec3 (*Vector*)

 **Returns**:
  - *number* : +1 or -1
  

.. js:function:: bounding_box(points)

 Computes the bounding box of a list of points
 
 **Parameters**:  
  - points ([]Vector)

 **Returns**:

 .. code-block:: javascript

    {
        width, height: number,
        top_left, top_right, bottom_left, bottom_right: Vector,
        left, right, top, bottom: Vector
    }
  
.. js:function:: convex_hull(points)
    
 Computes the convex hull of a list of points
 
 **Parameters**:  
  - points ([]Vector)

 **Returns**:
 - *[]Vector*

.. js:function:: random_vec
    
 Returns a uniformly random unit length vector

 **Returns**:
   - *Vector*
 
.. js:function:: polygon_contains_point(polygon_points, point)
    
 Determines if a point is inside a polygon specified by its boundary points. Exactly on the edge is not seen as inside.

 **Parameters**:
   - polygon_points (*[]Vector*)
   - point (*Vector*)

 **Returns**:
   - *boolean*

.. js:function:: deg_to_rad(degree)

 **Returns**:
   - *number*: The degree converted to radiants

.. js:function:: rad_to_deg(radiants)

 **Returns**:
   - *number*: The radiants converted to degree
 