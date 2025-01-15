import PatternStage from "../../../PatternLib/pattern_stages/baseStage.js";
import HeartSide from "../heart_side.js";

export default class DoubleSideStage extends PatternStage{
    constructor(){
        super()
    }

    get_right_heartside(){
        return new HeartSide(
            this.wd.top_point, this.wd.bottom_point, 
            this.wd.top_point.get_adjacent_lines().filter(l => l.data.side == "right")[0]
        );
    }

    get_left_heartside(){
        return new HeartSide(
            this.wd.top_point, this.wd.bottom_point, 
            this.wd.top_point.get_adjacent_lines().filter(l => l.data.side == "left")[0]
        );
    }
}