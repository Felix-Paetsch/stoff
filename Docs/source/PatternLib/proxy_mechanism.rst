The :doc:`StageProcess <parent>` proxy mechanism
===========================================================================

The :doc:`StageProcess <parent>` class provides a (hopefully nice) interface to work with `BaseStages <stages>`. 
Internally it has an array of BaseStages, starting with the :ref:`InitStage <init_stage>`. When you add stages using ``StageProcess.add_stage`` they will be added there.
Additionally it has a pointer to (counter of) the current stage.

Traversing stages
-----------------------

The StageProcess will move from one stage to the next stage, but only if it really has to (see below).
When it moves to the next stage it does so in the following steps:

1. It calls ``.on_exit(this.working_data, this.measurements)`` on the current stage (the result will be put in ``on_exit_result`` for 2.) Note that you dont need to use the arguments to that method; you don't even need to write them in the brackets when defining them in your class.
2. It sets the working data ``.working_data`` on the StageProcess and ``.wd`` for the next stage:
   
   a. If ``on_exit_result`` is truethy (not null/undefined/false/empty string/0) this will be the new working data
   b. Else if the current stages ``.wd`` is truethy, that will be the new working data
   c. We use the working data from the StageProcess

3. It sets ``.measurements`` to ``.measurements``
4. It calls ``.on_enter(this.working_data, this.measurements)`` on the next stage

When you directly call ``StageProcess.finish()`` after initialization, it will just move step by step to the last stage and then call ``.finish()`` on it and return the result. (And return it subsequently again every time you call ``StageProcess.get_result()``, see :doc:`StageProcess.finish() <parent>`).

Calling methods on stages
----------------------------------
Somewhat the whole point of stages and the lazy traversing of them is that you can have stage-specific methods. A stage can expose methods (and objects) through ``Stage._exposes(obj)`` and ``Stage._get(obj)``, see :doc:`BaseStage._exposes() <stages>`.

You access them, by callem them on the :doc:`StageProcess <parent>`. It will:

1. Tests if itself has the method of object & return that, otherwise
2. Tests the current stage if it exposes that thing and returns it, otherwise
3. Moves to the next stage and tries 2.

If the method (or object) is not exposed you get an error (which looks different to when you usually try to access a non-existing property and then do something with that). You have to figure out yourself in which stage you expected the method to be.
Perhaps you already moved one stage to far. Later I will add debugging for this very case. (One reason to give stages names.)


Handling global / global-ish data
------------------------------------

The data that should be passed between stages and is like a global config should be put inside the ``.working_data`` (``.wd``).
From the outside world you can do that with :doc:`StageProcess methods. <parent>` Additionally you can just do something like
``StageProcess.working_data.key = value``. Note that this only works, if it is indeed an object and the stages ``.wd`` is a reference to the same object.

Additionally you can of course update the working data inside stages, see :doc:`stages. <stages>`
You can also call methods on stages which then modify the working data for you.