Connected Component
=========================

A connected component inside a sketch. I.e. a set of points connected by lines.

**Source File**: ./StoffLib/connected_component.js

.. js:class:: ConnectedComponent
 
 **Constructor**:

 .. js:function:: constructor(element)
    
  **Parameters**:
   - element (*Point|Line*): The element the connected component is based of.

 **Attributes**:
 
 .. js:attribute:: root_el

    The element the connected component is based of. If the connected component is split in two
    this is the element whose component this then (still) refers to.

    **Type**: Point | Line

 **Methods**:

 The following methods are just like on a sketch, only on the lines/points belonging to the connected component:

 .. js:function:: transform(pt_fun = (_pt) => {})
    
 .. js:function:: mirror(...args)
    
 .. js:function:: group_by_key(key)
    
 .. js:function:: lines_by_key(key)
    
 .. js:function:: points_by_key(key)
    
 .. js:function:: get_bounding_box()


 .. js:function:: root()
     
  **Returns**:
    - *this.root_el*
    - 
 .. js:function:: points()

  Returns the points of the connected components.

  **Returns**:
    - *[]Point*
    - 
 .. js:function:: lines()

  Returns the lines of the connected components.

  **Returns**:
    - *[]Line*
  
 .. js:function:: contains(el)

  Returns whether the element belongs to the connected component.

  **Parameters**:
    - el *Line|Point*

  **Returns**:
    - *boolean*
    - 
 .. js:function:: equals(component)

  Returns whether this connected component is the same as the given one.

  **Parameters**:
    - component *ConnectedComponent*

  **Returns**:
    - *boolean*

 .. js:function:: obj()
     
  Returns the connected component "as an object." I.e. the points and lines of it.

  **Returns**
    - *object*

  .. code-block:: javascript

    {
        points: []Points,
        lines:  []Lines,
        bounding_box: this.get_bounding_box()
    }

 .. js:function:: to_sketch()
     
  Returns a new sketch with only this connected component on it.

  **Returns**
    - *Sketch*

 .. js:function:: toString()
     
  **Returns**:
    - *"[ConnectedComponent]*