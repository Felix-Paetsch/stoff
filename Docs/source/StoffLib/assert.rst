Assert
======

Provides a function for performing standard asserts. This function has many associated methods tailored for our use cases.

**Source File**: ./StoffLib/assert.js

.. js:method:: assert(bool, error)

   Your typical assert.

   **Parameters**
      - bool (*boolean*): Whether to throw the error
      - error (*string/obj*): Error message/descriptor

.. js:method:: assert.CALLBACK((str, fun) => null|string|boolean)

.. js:method:: assert.INVALID_PATH()

.. js:method:: assert.THROW(err_msg)

.. js:method:: assert.HAS_SKETCH(sketch_element, sketch)

.. js:method:: assert.HAVE_SKETCH(elements, sketch)

.. js:method:: assert.SAME_SKETCH(...args)

.. js:method:: assert.IS_ISOLATED(element)

.. js:method:: assert.NOT_ISOLATED(element)

.. js:method:: assert.IS_POINT(element)

.. js:method:: assert.IS_LINE(element)

.. js:method:: assert.IS_SKETCH(element)

.. js:method:: assert.IS_VECTOR(vec)

.. js:method:: assert.IS_SKETCH_ELEMENT(element)

.. js:method:: assert.IS_CONNECTED_COMPONENT(element)

.. js:method:: assert.HAS_ENDPOINT(line, point)

.. js:method:: assert.HAS_LINES(point, ...lines)

.. js:method:: assert.IS_DELETED(element)

.. js:method:: assert.ONE_ADJACENT_LINE(element)

.. js:method:: assert.TWO_ADJACENT_LINE(element
