import PatternConstructor from "../../PatternLib/patternConstructor.js";

import SingleSideStage from "../../PatternDev/heart/single_side_stage.js";
import DoubleSideStage from "../../PatternDev/heart/double_side_stage.js";
import CutStage from "../../PatternDev/heart/cut_stage.js";

export default function() {
    const heart = new PatternConstructor();
    heart.add_patter_stage(SingleSideStage);
    heart.add_patter_stage(DoubleSideStage);
    heart.add_patter_stage(CutStage);

    heart.set_length(0.9);
    
    /*
        What info does a stage need for construction??
        the constructor?
        the prev stage?
        after add_pattern_stage it should be initialized either way..
        (as we want to look at its attributes for later)
        shirt.PatternStage.whaa
        in theory a stage has a costructor, but nothing else neccessarily associated..
    */

    return heart.finish();
}
