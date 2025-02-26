import StageProcess from "../../../Core/Stages/stageProcess.js";

import SingleSideStage from "./PatternDev/heart/stages/single_side_stage.js";
import DoubleSideStage from "./PatternDev/heart/stages/double_side_stage.js";
import CutStage from "./PatternDev/heart/stages/cut_stage.js";
import Sketch from "../../../Core/StoffLib/sketch.js";
import SequentialStage from "../../../Core/Stages/base_stages/sequentialStage.js";

export default function() {
    const r = Sketch.dev.global_recording();

    const heart = new StageProcess();

    heart.add_stage(SingleSideStage);
    const ss = new SequentialStage();
    heart.add_stage(ss);
    ss.add_stage(DoubleSideStage);
    ss.add_stage(new CutStage());
    heart.set_length(1);
    
    // const hs = heart.get_general_heartside();
    // const hs = heart.get_right_heartside();
    // const hs = heart.get_left_heartside();
    // hs.wing(0.2);

    heart.add_right_wing(.7);
    heart.log();

    r.at_url("/test");
    return heart.finish();
}