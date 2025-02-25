import StageProcess from "../../../PatternLib/stageManager";
import CurveLinesStage from "../annotation_stages/curve_stage";
import DartAnnotationStage from "../annotation_stages/dart_annotation_stage";
import SeamAllowanceStage from "../annotation_stages/seam_allowance_stage";
import BasicBaseStage from "../basic_pattern_stages/basic_pattern_stage";
import DartBaseStage from "../basic_pattern_stages/dart_pattern_stage";




export default class EasyPatternFrontBackStages extends StageProcess{
    constructor(){
        super();
    }
    
    on_entry(ease){
        console.log(this.wd)
           const front = new StageProcess(calculate_measurements(measurements));
        front.set_working_data({
            ease: ease
        });

        const back = new StageProcess(calculate_measurements(measurements));
        back.set_working_data({
            ease: ease
        });
        
        front.add_stage(BasicBaseStage);
        front.add_stage(DartBaseStage);
        front.add_stage(CurveLinesStage);
        front.add_stage(DartAnnotationStage);
        front.add_stage(SeamAllowanceStage);

        back.add_stage(BasicBaseStage);
        back.add_stage(DartBaseStage);
        back.add_stage(CurveLinesStage);
        back.add_stage(DartAnnotationStage);
        back.add_stage(SeamAllowanceStage);

        this.wd.front = front;
        this.wd.back = back;


    };

    

    finish(){
        return this.wd.front.finish()
    }


    single_waistline_dart(){

    }


}