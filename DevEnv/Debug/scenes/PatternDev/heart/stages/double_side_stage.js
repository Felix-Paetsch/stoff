import BaseStage from "../../../../../../Core/Stages/base_stages/baseStage.js";
import HeartSide from "../heart_side.js";

export default class DoubleSideStage extends BaseStage{
    constructor(){
        super()
    }
    
    add_left_wing(scale = 1){
        return this.get_right_heartside().wing(scale);
    }

    add_right_wing(scale = 1){
        return this.get_right_heartside().wing(scale);
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