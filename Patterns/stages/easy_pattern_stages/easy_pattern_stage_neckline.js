import BasicBaseStage from "../basic_pattern_stages/basic_pattern_stage.js";
import NecklineBaseStage from "../basic_pattern_stages/neckline_pattern_stage.js";
import SequentialStage from "../../../Core/Stages/base_stages/sequentialStage.js";


export default class EasyPatternNecklineStage extends SequentialStage{
    constructor(one_waistline_dart = true){
        super();
        this.add_stage(new BasicBaseStage(one_waistline_dart));
        this.add_stage(NecklineBaseStage);        
    }
    
    on_enter(){
        super.on_enter();
        this.call_substage_method("draw_waitline_darts");
        
        //      Dangerous: this.call_stage_method("two_waistline_darts");
        // Also Dangerous: this.stages[0].two_waistline_darts(); (Unexpected results if stage not currently entered)
    }


    neckline(type){
        
        switch (type) {
            case "v-line":
                this.call_substage_method("round_neckline");
                this.call_substage_method("v_line");
                break;
            case "round":
                this.call_substage_method("round_neckline");
                break;
            case "square":
                this.call_substage_method("square_neckline");
                break;
            default:
                break;
        }
    }


    widen_neckline(percentage) {
        this.call_substage_method("wide_neckline", [percentage]);
    }
    deepen_neckline(percentage) {
        this.call_substage_method("deep_neckline", [percentage]);
    }
}