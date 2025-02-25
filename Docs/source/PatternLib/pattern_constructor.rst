Pattern Constructor
====================

The `StageProcess` class serves as the orchestrator for creating sewing patterns. It manages a sequence of `BaseStages` and the transitions between them using
a :doc:`proxy mechanism. <proxy_mechanism>`

**Source File**: ./PatternLib/stageManager.js

.. js:class:: StageProcess

   **Constructor**:

    .. js:function:: constructor(measurements = null, stages = [])

        **Parameters**:
            - measurements (*object*): The user measurements. The measurements key of the stages will be set to this.
            - stages (*[]BaseStage*): An array of initial stages for this pattern. See ``this.add_pattern_stage(stage, position_ident)`` for details

   **Methods**:

    .. js:function:: add_stage(stage, position_ident = null)
    
        Adds a ``BaseStage`` to the stages for this pattern. We can either give an instance of ``BaseStage`` as an argument
        or a class which inherits from ``BaseStage``. In the later case we will initialize it with no parameters.
        If ``position_ident == null`` we just push the stage to the end. Otherwise we (for now) get an error.

        **Parameters**:
            - stage (*BaseStage | class*): The stage to add to the pattern
            - position_ident (*obj | null*): Information on where to add the class. (Todo)

        **Returns**:
            - this (proxy)

    .. js:function:: set_working_data(data)
        
            Sets we working data of the StageProcess and of the current stage to ``data``
    
            **Parameters**:
                - data (*obj*): The new working data
    
            **Returns**:
                - this (proxy)

    .. js:function:: get_working_data()
        
            Returns the working data of the current stage. If that is falsy returns the working data of the StageProcess
    
            **Returns**:
                - *object*: Working Data
            
    .. js:function:: finish()
    
        Finishes the current pattern by traversing through all stages and calling ``.finish()`` on the last stage (without exiting it.)
        The return result of that ``.finish()`` is the return result of this method. Note we can only finish once.

        **Returns**:
            - *any*: Endresult

    .. js:function:: get_result()
    
        If you don't know (or track) whether you already called finished, or want to get the result again, use this method.
        It gives you the same result as ``this.finish()``

        **Returns**:
            - *any*: Endresult
