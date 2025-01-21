Pattern Stages
==============

Pattern stages are sequential building blocks used by the :doc:`PatternConstructor <pattern_constructor>` to assamble as sewing pattern.
See here for a :doc:`guide <stages_guide>` how they are indended to be used and work together with the :doc:`PatternConstructor <pattern_constructor>`.

**Source File**: ./PatternLib/pattern_stages/baseStage.js

.. js:class:: PatternStage

   The PatternStage class defines the base structure for a stage in the pattern constructor.
   Every other PatternStage is expected to inherit from this class.

   **Constructor**:

    .. js:function:: constructor()

   **Attributes**:

    .. js:attribute:: name

        The name of the stage. Should be overridden in subclasses.

        **Type**: string | null

        **Default**: null

    .. js:attribute:: wd

        Shorthand for "working data". The working data is used to communicate
        between different stages and the pattern constructor.

        The working data is set by the :doc:`PatternConstructor <pattern_constructor>`
        before this stages ``.on_enter()`` is called.
        Inside the stage you can either work with having data on the stage directly
        or storing it inside ``this.wd``. If you don't return anything from ``this.on_exit()`` the :doc:`PatternConstructor <pattern_constructor>`
        will the the working data of the next stage to the working data of this one (if it is not falsy).

        **Type**: object

    .. js:attribute:: measurements

        The measurements will be set like ``this.wd`` from the :doc:`PatternConstructor <pattern_constructor>` before ``this.on_enter()``

        **Type**: object

    .. js:attribute:: pattern_constructor

        Reference to the parent pattern constructor. Assigned before the on_enter method is called.

        **Type**: object

    .. js:attribute:: exposed_added
    
            A dictionary (object) with keys which are exposed and resolve to the corresponding value,
            see ``this.__exposes(obj)``. Note that this object takes precidence over methods on the class.
    
            **Type**: object
    
            **Default**: {}

    .. js:attribute:: exposed_removed
    
            A list of strings which keys not to expose.
    
            **Type**: []string
    
            **Default**: ["on_enter", "on_exit", "finish", "remove_exposed", "add_exposed"]
    
        

   **Methods**:

    .. js:function:: _exposes(obj)
    
        Tells the :doc:`PatternConstructor <pattern_constructor>` whether a given method or object (with key "obj") from this class 
        (or computed - see ``this.__get()``) is exposed for the :doc:`proxy functionality <proxy_mechanism>` of the :doc:`PatternConstructor <pattern_constructor>`.
        By default we expose:
        
        - Methods on this class which dont start with ``_`` (and are not internal  ``#``.) and are not contained in ``this.exposed_removed``
        - Methods or objects in ``this.exposed_added``
  
        This method can be overwritten if you have more advanced usecases.

        **Parameters**:
            - obj (*string*): The method (or object) name to check.

        **Returns**:
            - *boolean*: Whether the method is exposed.

    .. js:function:: __get(obj)
    
        See also ``this._exposes(obj)``. Given a key called on the  :doc:`PatternConstructor <pattern_constructor>`
        which is :doc:`propagated <proxy_mechanism>` to this class instance, we return the corresponding value. It can either be something like
        ``this[obj]`` or more sufficticated like an on the fly created function.  

        **Parameters**:
            - obj (*string*): The method (or object)  name to retrieve.

        **Returns**:
            - The method/object

        **Raises**:
            - If the method is not exposed.

    .. js:function:: remove_exposed(key)
    
        Removes a (potentially) exposed method/object, by adding the key to ``this.exposed_removed`` (and removing it from ``this.exposed_added``.)
        Note that the actual method or object is not deleted and can further be used internally.

        **Parameters**:
            - key (*string*): The method/object name to remove from exposed

        **Returns**:
        	- this
  
    .. js:function:: add_exposed(key, value)
    
        Adds a method to ``this.exposed_added``, potentially removing it from the excluded list.

        **Parameters**:
            - key (*string*): The method name to expose.
            - value (*function*): The method reference to add.

        **Returns**:
        	- this

    .. js:function:: on_enter()

        Enters the stage. This usually means modifying a sketch or similar exposed in ``this.wd``
        so that the exposed functionality may be used, before we eventually exit the stage.
        Note that by now ``this.wd`` and ``this.pattern_constructor`` will have been set from the outside.
            
    .. js:function:: on_exit()
        
        Exits the stage. This usually means performing "intermediate finishing touches" to a sketch (or doing nothing).
        If this method returns something not falsy this will be the new working data. Else the stages working data will be the new working data.
        (If we latter is also falsy we resort to the working data of the :doc:`PatternConstructor <pattern_constructor>`.)

        **Parameters**:
            - arg1 (*type*): The first argument.

        **Returns**:
            - *string | null*: The new working data.
  
    .. js:function:: finish()
        
        If this stage is the last stage it is expected that ``this.finish()`` is implemented.
        The return result of this will be the return result of the pattern construction, see :doc:`PatternConstructor.finish() <pattern_constructor>`.


        **Raises**:
            - If not implemented (overwritten)
        
    .. js:function:: advance_stage()
        
        Advances the :doc:`PatternConstructor <pattern_constructor>` to the next stage (so the stage after this one).
        
**Source File**: ./PatternLib/pattern_stages/initStage.js

.. _init_stage:

.. js:class:: InitStage
    
   ``class InitStage extends baseStage``
   This stage marks the beginning of the construction of a sewing pattern. It is used inside the :doc:`PatternConstructor <pattern_constructor>`.

   **Constructor**:

    .. js:function:: constructor()