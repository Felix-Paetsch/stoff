import PatternConstructor from "../../PatternLib/patternConstructor.js";

import SingleSideStage from "../PatternDev/heart/stages/single_side_stage.js";
import DoubleSideStage from "../PatternDev/heart/stages/double_side_stage.js";
import CutStage from "../PatternDev/heart/stages/cut_stage.js";

export default function() {
    const heart = new PatternConstructor();
    heart.add_patter_stage(SingleSideStage);
    heart.add_patter_stage(DoubleSideStage);
    heart.add_patter_stage(CutStage);
    heart.add_patter_stage(new CutStage());

    heart.set_length(1);
    
    // const hs = heart.get_general_heartside();
    // const hs = heart.get_right_heartside();
    const hs = heart.get_left_heartside();
    hs.wing(0.2);

    heart.add_right_wing(.7);

    return heart.finish();
}