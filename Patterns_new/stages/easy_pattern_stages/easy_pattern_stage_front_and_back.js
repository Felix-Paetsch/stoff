import PatternConstructor from "../../../PatternLib/patternConstructor";
import CurveLinesStage from "../annotation_stages/curve_stage";
import DartAnnotationStage from "../annotation_stages/dart_annotation_stage";
import SeamAllowanceStage from "../annotation_stages/seam_allowance_stage";
import BasicPatternStage from "../basic_pattern_stages/basic_pattern_stage";
import DartPatternStage from "../basic_pattern_stages/dart_pattern_stage";




export default class EasyPatternFrontBackStages extends PatternConstructor{
    constructor(){
        super();
    }
    
    on_entry(ease){
        console.log(this.wd)
           const front = new PatternConstructor(calculate_measurements(measurements));
        front.set_working_data({
            ease: ease
        });

        const back = new PatternConstructor(calculate_measurements(measurements));
        back.set_working_data({
            ease: ease
        });
        
        front.add_patter_stage(BasicPatternStage);
        front.add_patter_stage(DartPatternStage);
        front.add_patter_stage(CurveLinesStage);
        front.add_patter_stage(DartAnnotationStage);
        front.add_patter_stage(SeamAllowanceStage);

        back.add_patter_stage(BasicPatternStage);
        back.add_patter_stage(DartPatternStage);
        back.add_patter_stage(CurveLinesStage);
        back.add_patter_stage(DartAnnotationStage);
        back.add_patter_stage(SeamAllowanceStage);

        this.wd.front = front;
        this.wd.back = back;


    };

    

    finish(){
        return this.wd.front.finish()
    }


    single_waistline_dart(){

    }


}