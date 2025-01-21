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

   **Constructor**:

   .. js:function:: constructor()
      
      **Parameters**:
          - obj (*string*): The method name to check.
      

   **Attributes**:

   **Methods**:
      
      
    
      
      
    
      
      
    
      
        
    
        
       
   
       
        
        
    
        
        
    
        
        
        
          
    
        
          
    
        
          
    
        
        
          
    
        




          
    
        
          
    
        
          
    
        
          
    
        
          
    
        