Curves
=========================

Functionality to draw specific curves. They can all be used as in:

.. code-block:: javascript

    sketch.line_from_function_graph(
        p1, p2, arc(0.5)
    );

On almost all functions (currently the spline function) you can call ``fn.plot_control_points(sketch, pt_callback = (pt) => {})``, see below

**Source File**: ./StoffLib/curves.js

.. js:function:: arc(fill_amt)
 
 Returns a function of a circle arc.

 **Parameters**:
    - fill_amt (*number*): How much of the circle is filled (between -1 and 1).
 
 **Returns**:
    - *(number) => [number, number]*



.. js:function:: spline.bezier(points)
 
 Returns a bezier spline (of degree | points - 1 |) through the points. 

 **Parameters**:
    - points (*[]Vector*): The control points for the curve
 
 **Returns**:
    - *(number) => [number, number]*

.. js:function:: spline.bezier_spline(points)
 
 Returns a quadratic bezier spline (of degree 2) through the points. 

 **Parameters**:
    - points (*[]Vector*): The control points for the curve
 
 **Returns**:
    - *(number) => [number, number]*

.. js:function:: spline.bezier_smooth_cubic(points, tangents, relative = true)
 
 Returns a smooth cubic bezier spline path through the ``points`` with the given ``tangents`` vectors at each point.
 (Same amount of points and tangents, as smoothness removes a degree of fredom.) 

 **Parameters**:
    - points (*[]Vector*): The control points for the curve
    - tangents (*[]Vector*): The tangent vectors at the points
    - relative (*boolean*): Whether the tangents are actual tangent vectors (true) or points in which the tangents should point (false).
 
 Note that the magnitude of the tangent vectors is also important.

 **Returns**:
    - *(number) => [number, number]*

.. js:function:: spline.hermite_spline(points, velocities, relative = true)
 
 Returns a hermite spline throught the points with the given velocities.

 **Parameters**:
    - points (*[]Vector*): The control points for the curve
    - velocities (*[]Vector*): The velocities at the points
    - relative (*boolean*): Whether the velocities are actual velocity vectors (true) or points in which the velocities should point (false).
 
 **Returns**:
    - *(number) => [number, number]*

.. js:function:: spline.catmull_rom_spline(points, start_velocity = null, end_velocity = null, relative = true)
 
 Returns a Catmull-Rom-Spline with the given parameters

 **Parameters**:
    - points (*[]Vector*): The control points for the curve
    - start_velocity (*Vector|null*): The velocity at the start point, default being first point -> second point
    - start_velocity (*Vector|null*): The velocity at the end point, default being second last -> last point
    - relative (*boolean*): Whether the velocities are actual velocity vectors (true) or points in which the velocities should point (false).
 
 **Returns**:
    - *(number) => [number, number]

.. js:function:: spline.fn.plot_control_points(sketch, pt_callback = (pt, i) => {}, ln_callback = (ln, i) => {})
 
 Plots the control points of the spline in the sketch. Usefull to see what is actually going on.
 It returns the function again, so you can easily do

 ``fn.plot_control_points(sketch)``

 **Parameters**:
    - sketch (*Sketch*): The sketch where to plot the control points and lines
    - pt_callback (*(pt, number) => null*): A method run on all control points inserted. The number is the index of the control point in all control points plotted
    - ln_callback (*(ln, number) => null*): A method run on all lines inserted
 
 **Returns**:
    - *(number) => [number, number]*: The original function
