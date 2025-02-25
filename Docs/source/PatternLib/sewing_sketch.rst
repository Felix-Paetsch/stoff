Sewing Sketch
==============

`SewingSketches` expands upon :doc:`Sketch <../Core/StoffLib/sketch>` and implements higher-level, more sewing-pattern related functionality. 
You most likely will prefer a ``SewingSketch`` over the normal ``Sketch`` when working in this domain.
Also it is a bit more oppinionated, as some methods only work well when :doc:`Points <../Core/StoffLib/point>` or :doc:`Lines <../Core/StoffLib/line>`
have the ``type`` key set in their ``data`` attribute.

**Source File**: ./PatternLib/sewing_sketch.js

.. _init_stage:

.. js:class:: SewingSketch

   ``class SewingSketch extends Sketch``

   **Constructor**:

    .. js:function:: constructor()

   **Methods**:

    .. js:function:: order_by_endpoints(...lines)
        
            Takes in an array of lines and orders them by their endpoints.
            I.e. it returns an array with the same lines such that each consecutive have common endpoints.
    
            **Parameters**:
                - ...lines (*[]Line*)
    
            **Returns**:
                - *[]Line*
  
            **Throws**:
                - If lines don't form a connected segment
  
    .. js:function:: anchor(...objects)
        
            Adds in lines to connect all objects to one connected component. If none are given, it connects all objects.
            Usefull to move them together using component methods, while retaining their relative position.
            The lines will have data attributes:

            .. code-block:: javascript

             {
                 "__anchor": true
             }

            You can remove the anchors manually or by calling ``SewingSketch.remove_anchors()``.
    
            **Parameters**:
                - objects (*[](Line | Point | ConnectedComponent)*): The things to connect
    
            **Returns**:
                - this
            
    .. js:function:: remove_anchors()
        
            Removes all anchor lines introduced by ``this.anchor(...objects)``
    
            **Returns**:
                - this
  
    .. js:function:: cut(line, ...args)
        
            Cuts a sewing sketch at a given line or line array. That means it dublicates the line and one or both endpoints
            and sets the endpoints of the other lines connected to the original line accordingly.

            It has many possible signatures. So we first give what are all the internal arguments and then how the signature translates to these arguments:

            **Single cut line**

            - ``line : Line``: The line segment that should be cut at
            - ``fixed_pt : null | Point``: A point of the line segment that should stay fixed
            - ``grp1 : []Line``: The existing lines that should be attatched to the first cut component
            - ``grp2 : []Line``: The existing lines that should be attatched to the second cut component

            If ``fixed_pt = false`` we cut along ``line`` and attatch the ``grp1`` lines to the first component, the ``grp2`` lines to the second.
            We then return

            .. code-block:: javascript

             {
                 cut_parts: [
                     {
                         line: line2,
                         adjacent: grp1
                     },
                     {
                         line: line1,
                         adjacent: grp2
                     }
                 ]
             }

            If ``fixed_pt = true`` we also cut, but keep the components together at the fixed point and return 

            .. code-block:: javascript

             {
                 fixed_pt: fixed_pt,
                 cut_parts: [
                     {
                         line: line2,
                         adjacent: grp1
                     },
                     {
                         line: line1,
                         adjacent: grp2
                     }
                 ]
             }

            **Line array cut**

            [Planned, but currently not implemented]
    
            **Translation**

            The signatures are translated as follows:

            .. code-block:: javascript
            
             ([pt1 : Point, pt2 : Point], fixed_pt = null : null | Point, ...groups)
             /*
                `line`: The only line from pt1 to pt2. If there is none, then a straight line.
                `fixed_pt`:
                    `null` if fixed_pt is null
                    `fixed_pt` if fixed_pt is either pt1 or pt2
                    `pt1` is fixed_pt is true
                `grp1`, `grp2`:
                    See below, computed from ...groups
             */
            
             ([pt1 : Point, pt2 : Point], ...groups)
             /*
                `line`: The only line from pt1 to pt2. If there is none, then a straight line.
                `fixed_pt`: null
                `grp1`, `grp2`:
                    See below, computed from ...groups
             */
            
             (line : Line, fixed_pt = null : null | Point, ...groups)
             /*
                `line`: line
                `fixed_pt`:
                    `null` if fixed_pt is null
                    `fixed_pt` if fixed_pt is either pt1 or pt2
                    `line.p1` is fixed_pt is true
                `grp1`, `grp2`:
                    See below, computed from ..groups
             */
            
             (line : Line, ...groups)
             /*
                `line`: line
                `fixed_pt`: null
                `grp1`, `grp2`:
                    See below, computed from ..groups
             */

            The groups are given/computed as follows:

            .. code-block:: javascript

                ...groups = []
                // Same as ...groups = ["smart", "smart"]
                ...groups = [grp1 : Line | []Line]
                // Same as ...groups = [grp1, "smart"]
            
                ...groups = ["smart", "smart"]
                /* We assume that each non-fixed point has exactly 2 non-cut lines.
                   Both lines of each are expected to be connected to exactly one line of the other
                   with a line-path not including `line` itself.
                   (I.e. it has to be clear which lines should belong to the same cut part)
                */

                ...groups = [grp1 : Line | []Line, "smart"]
                /*
                    Everything that is not grp1 goes to grp2.
                */

                ...groups = [grp1 : Line | []Line, grp2 : Line | []Line]
                /*
                    All lines to non-fixed points that are neither in grp1 nor grp2 get deleted
                */


    .. js:function:: glue(ident1, ident2, data = {})
        
            Glues two lines of

            - different connected components
            - OR two lines of the same connected component, just that their common point is the only join between two parts of the component (Imagine two connected components and then make them have one point in common.)
    
            **Parameters**:
                - ident1 (*Line | [Point, Point] | [Line, Endpoint]*): Identification of first glue line
                - ident1 (*Line | [Point, Point] | [Line, Endpoint]*): Identification of second glue line
                - data (*object*): Set some keys to achieve further functionality, see below
    
            The different identifications will be converted to the form

            .. code-block:: javascript
            
             [Point, Point] => [Point, Point]
             Line => [Line.p1, Line.p2]
             [Line, Endpoint] => [Endpoint, Line.other_endpoint]
    
            We then glue the first point of each together and the second point of each together.

            Data can have the following arguments:

            .. code-block:: javascript

                data = {
                    points: "merge", // or:  "delete", "delete_both", callback
                    lines:  "delete" // or:  "keep", "merge", callback
                    anchors: "keep"  // or:  "delete"
                }
        
            The keys can be set to the following:

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
                        
            **Returns**

            Returns one of

            .. code-block:: javascript

                // Fixed
                {
                    glue_type: "with_fixed",
                    point: merged_pt,
                    fixed_point: fixed,

                    glue_line, // May be excluded if there is no glue line 

                    remove_points: false,
                    line_handling: "merge"
                }

                // Non Fixed
                {
                    glue_type: "without_fixed",
                    points: merged_pts,

                    glue_line, // May be excluded if there is no glue line 

                    remove_points: false,
                    line_handling: "merge"
                }
            
            **Notes**
            
            When using data callbacks, whenever two points (or, seperately, lines) are merged, then the same callback is used. Look at the docs for the callback to see how to figure out in the callback which particular things we merge.
            When gluing lines (without deleting points) the orientation of the first lines is used. When glueing with deleting points it is not really save to deduce which orientation the glues lines have, as this depends on the order how they are stored in the `sketch` object.
            You can use anchors (`SewingSketch.anchor(<>)`) to rotate the correct things along the main connected component when glueing.
    
    .. js:function:: oriented_component(el)
        
            Takes the lines of the connected component of an element and returns it in clockwise order.
    
            **Parameters**:
                - el (*Point | Line | ConnectedComponent*): The element whose component you want to look at
    
            **Returns**:
            
            .. code-block:: javascript
            
             { 
                lines: "Die Linien im Uhrzeigersinn", // Line[]
                points: "Die Punkte im Uhrzeigersinn", // Point[]
                        "startend mit dem Endpunkt der ersten Linie am weitesten vorne im Uhrzeigersinn"
                orientation: "Für jede Linie, ob p1 -> p2 im Uhrzeigersinn verläuft" // Boolean[]
             }
            
    .. js:function:: path_between_points(p1, p2, line = null)
        
            Give an array of line segments connecting the two points. Assumes there exists an unique direct one (at least when starting going down one specific line).
            Designed for cyclic connected components, as we currently expect each point along the path to have exactly two (one) outgoing lines. To be extended to "semi"-acyclic components.
    
            **Parameters**:
                - p1 (*Point*): The starting point
                - p2 (*Point*): The end point
                - line (*null | Line*): The direction to start searching for the other point.  
    
            **Returns**:
                - *[]Line*: The uniquely determined path between the points (with lines in order).
  
    .. js:function:: decompress_components()
        
            Spreads the connected components in a grid on the same sketch.

            **Returns**:
            
            this
            
    
    .. js:function:: remove_underscore_attributes(...attr)
        
            Removes ceratin keys from the data attributes. If ``attr`` is empty, remove all attributes starting with ``__``.
            Otherwise remove all attributes which are listed in ``attr``, perhaps after adding a ``__`` to a string in ``attr``.
    
            **Parameters**:
                - ...attr (*[]string*): The attributes to remove
    
            **Returns**:
            
            this
            
    .. js:function:: delete_with_underscore_attributes(...attr)
        
        Same as ``this.remove_underscore_attributes(...attr)`` except it deletes all lines/points with the key, instead of just remoing the key.

        **Parameters**:
            - ...attr (*[]string*): The attributes to consider

        **Returns**:
        
        this
    
    .. js:function:: unfold(along_line, callback = (_element, _type, _original) => {}, in_place = true)
        
            Unfolds the Sketch along a ceratin line.
    
            **Parameters**:
                - along_line (*[pt1, pt2] | Line*): The line to unfold along. (If points are given we expect at most one line between them.)
                - callback (*(element, type, original) => {}*): A callback executed after the unfolding on each Point and Line. `element` will become we specific Point or Line we use the callback on. `type = "mirror" | "mirror` tells you whether it is the mirrored version. `original` is the original element (in either case.)
                - in_place (*boolean*): Whether to unfold in this sketch or on a new sketch.

            **Returns**:
                - *SewingSketch*: This of the sketch we unfold upon
            
    
    .. js:function:: get_typed_line(type)
        
            Returns the (single) line of the sketch with ``Line.data.type == type``.
            Throws if there are more than one lines with that type.

            **Parameters**:
                - type (*string*)
    
            **Returns**:
                - *Line | null*: The line with the type
  
    .. js:function:: get_typed_lines(type)
        
            Returns all the lines of the sketch with ``Line.data.type == type``.
            The return array has additionally the methods from ``this._set_typed_line_point_array_methods()`` (see below) you can call on it.
            Throws if there are more than one lines with that type.

            **Parameters**:
                - type (*string*)
    
            **Returns**:
                - *[]Line*: All lines with that type
            
    .. js:function:: get_untyped_lines(type)
        
            Returns all the lines of the sketch without ``Line.data.type`` set.
            The return array has additionally the methods from ``this._set_typed_line_point_array_methods()`` (see below) you can call on it.
            Same as ``this.get_typed_lines("_")``.

            **Parameters**:
                - type (*string*)
    
            **Returns**:
                - *[]Line*: All lines without a type
  
    .. js:function:: get_typed_point(type)
        
            See ``this.get_typed_line(type)``:

            **Parameters**:
                - type (*string*)
    
            **Returns**:
                - *Point | null*
  
    .. js:function:: get_typed_points(type)
        
            See ``this.get_typed_lines(type)``

            **Parameters**:
                - type (*string*)
    
            **Returns**:
                - *[]Point*
            
    .. js:function:: get_untyped_points(type)
        
            See ``this.get_untyped_points(type)``

            **Parameters**:
                - type (*string*)
    
            **Returns**:
                - *[]Point*
  
    
    .. js:function:: get_points_between_lines(check1, check2)

            Goes through all points and pairs lines adjacent at that point. 
            If one satisfies ``check1`` and the other ``check2``, the point is added to a list to be returned.
            The return array has additionally the methods from ``this._set_typed_line_point_array_methods()``, see below.

            A *string* check will compare the lines ``data.type`` against that string.
            A *Line* check will look for equality.
            A *function* is expected to give a boolean whether the line satisfies the check.
            *null* just allows any line

            **Parameters**:
                - check1 (*string|Line|(Line)=>Boolean|null*): The check on the first line
                - check2 (*string|Line|(Line)=>Boolean|null*): The check on the second line
    
            **Returns**:
                - *[]Point*: Points between two lines meeting the criteria
            
    .. js:function:: get_point_between_lines(check1, check2)
        
            Similar to ``this.get_points_between_lines(check1, check2)``. 
            If two points are found that meet the criteria we throw an error. (todo)
    
            **Parameters**:
                - check1 (*string|Line|(Line)=>Boolean|null*): The check on the first line
                - check2 (*string|Line|(Line)=>Boolean|null*): The check on the second line
    
            **Returns**:
                - *Point | null*
            
    
    .. js:function:: get_line_between_points(check1, check2)
        
            Same as ``this.get_points_between_lines(check1, check2)`` except it looks at lines with the endpoints satisfying the checks.
            (This is independed of whether ``line.p1`` or ``line.p2`` passes the first check.)

            **Parameters**:
                - check1 (*string|Point|(Point)=>Boolean|null*): The check on the first point
                - check2 (*string|Point|(Point)=>Boolean|null*): The check on the other point
    
            **Returns**:
                - *[]Line*: Lines between two points meeting the criteria
    
    .. js:function:: get_line_between_points(check1, check2)
        
            Same as ``this.get_point_between_lines(check1, check2)`` except it looks at lines with the endpoints satisfying the checks.

            **Parameters**:
                - check1 (*string|Point|(Point)=>Boolean|null*): The check on the first point
                - check2 (*string|Point|(Point)=>Boolean|null*): The check on the other point
    
            **Returns**:
                - *Line | null*: Line between two points meeting the criteria
            
    
    .. js:function:: get_adjacent_lines(pt, check = null)
        
            Get all adjacent lines to the point satisfying the check (see ``this.get_points_between_lines(check1, check2)``).
    
            **Parameters**:
                - pt (*Point*)
                - check (*string|Line|(Line)=>Boolean|null*):
    
            **Returns**:
                - *[]Line*: Adjacent lines meeting the criteria
            
    .. js:function:: get_adjacent_line(pt, check = null)
        
            Similar to ``this.get_adjacent_lines(pt, check)``. 
            If two points are found that meet the criteria we throw an error. (todo)
    
            **Parameters**:
                - pt (*Point*)
                - check (*string|Line|(Line)=>Boolean|null*):
    
            **Returns**:
                - *Line | null*: The adjacent line meeting the criteria
        
    .. js:function:: _set_typed_line_point_array_methods(arr)
        
            Sets the following method on the array:

            .. code-block:: javascript

             arr.set_type = (t) => {
                 arr.forEach(x => x.data.type = t);
                 return arr;
             };
             arr.set_data = (data) => {
                 arr.forEach(x => {
                     if (typeof data == "function") {
                         const r = data(x);
                         if (r) x.data = r;
                     } else {
                         x.data = dublicate_data(data);
                     }
                 });
                 return arr;
             };
    
            **Parameters**:
                - arr (*[](Line|Point)*): The array to modify
    
            **Returns**:
                - arr
        