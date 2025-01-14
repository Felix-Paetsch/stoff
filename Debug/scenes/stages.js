import Sketch from "../../StoffLib/sketch.js";
import PatternConstructor from "../../PatternLib/patternConstructor.js";
import InitStage from "../../PatternLib/pattern_stages/initStage.js";

export default function() {
    const shirt = new PatternConstructor();
    shirt.add_patter_stage(new InitStage());
    
    /*
        What info does a stage need for construction??
        the constructor?
        the prev stage?
        after add_pattern_stage it should be initialized either way..
        (as we want to look at its attributes for later)
        shirt.PatternStage.whaa
        in theory a stage has a costructor, but nothing else neccessarily associated..
    */

    shirt.hi = "you";
    console.log("hi there");

    const s = new Sketch();
    return s;
}
