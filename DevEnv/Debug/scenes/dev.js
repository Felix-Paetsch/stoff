import StageProcess from "../../../Core/Stages/stageManager.js";

import SingleSideStage from "./PatternDev/heart/stages/single_side_stage.js";
import DoubleSideStage from "./PatternDev/heart/stages/double_side_stage.js";
import CutStage from "./PatternDev/heart/stages/cut_stage.js";
import Sketch from "../../../Core/StoffLib/sketch.js";

export default function() {
    const r = Sketch.dev.global_recording();

    const heart = new StageProcess();

    heart.add_stage(SingleSideStage);
    heart.add_stage(DoubleSideStage);
    heart.add_stage(CutStage);
    heart.add_stage(new CutStage());

    heart.set_length(1);
    
    // const hs = heart.get_general_heartside();
    // const hs = heart.get_right_heartside();
    // const hs = heart.get_left_heartside();
    // hs.wing(0.2);

    heart.add_right_wing(.7);

    r.at_url("/test");
    return heart.finish();
}