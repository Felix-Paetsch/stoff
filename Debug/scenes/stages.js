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

    heart.set_length(1);
    
    // const hs = heart.get_general_heartside();
    // const hs = heart.get_right_heartside();
    // const hs = heart.get_left_heartside();
    // hs.wing(0.2);

    heart.add_right_wing(.7);
    
    /*
        What info does a stage need for construction??
        the constructor?
        the prev stage?
        after add_pattern_stage it should be initialized either way..
        (as we want to look at its attributes for later)
        shirt.PatternStage.whaa
        in theory a stage has a costructor, but nothing else neccessarily associated..
    */

    r.at_url("/test");
    return heart.finish();
}
