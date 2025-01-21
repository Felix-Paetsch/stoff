Using :doc:`PatternStages <stages>`
=======================================

A sewing pattern usually is constructed sequentially. In several stages.
Stages might be things like:

- A shirt (side) half (think cut at the symmetry line)
- A shirt (side) after we unfolded the symmetry line
- Filling in all darts
- All seam allowances added 
- ...

Currently the stage process is not _that_ sufficticated, but it will get more evolved over time.

Until you need further functionality than currently we workflow is as follows:
  

High level
---------------

Looks something like

.. code-block:: javascript

    import PatternConstructor from "../../PatternLib/patternConstructor.js";

    import SingleSideStage from "../PatternDev/heart/stages/single_side_stage.js";
    import DoubleSideStage from "../PatternDev/heart/stages/double_side_stage.js";
    import CutStage from "../PatternDev/heart/stages/cut_stage.js";
    import Sketch from "../../StoffLib/sketch.js";

    export default function() {
        const r = Sketch.dev.global_recording();

        const heart = new PatternConstructor();

        heart.add_patter_stage(SingleSideStage);
        heart.add_patter_stage(DoubleSideStage);
        heart.add_patter_stage(CutStage);


        heart.add_right_wing(.7);
        return heart.finish();
    }

You initialize your pattern, add some stages and then call functions on the :doc:`PatternConstructor <pattern_constructor>`.
The functions called must be in order as stages expose them. You can't add a general wing after adding a right wing for example.

Stages
------------------

You will spend much of your time building stages. I intend there to be all kind of (base) stages (especially ones which aren't strictly linear - so e.g. the front and back of a shirt can be handled at the same time, but - if wanted - in different stages/areas.)
Whenever you feel like the current stuff is not enough, reach out.

Stages should assume as little as possible over the pattern and make clear (in code comments) which assumptions they make. We want them to be used modularly.
To communicate between stages use :doc:`working data. <proxy_mechanism>` You probably don't want to put unneccessary things in there, as to not have other code access attributes you don't really care about anymore when updating your code.


