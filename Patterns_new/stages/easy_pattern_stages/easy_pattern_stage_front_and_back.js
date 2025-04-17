import SequentialStage from "../../../Core/Stages/base_stages/sequentialStage.js";
/*import StageProcess from "../../../PatternLib/stageManager.js";
import CurveLinesStage from "../annotation_stages/curve_stage.js";
import DartAnnotationStage from "../annotation_stages/dart_annotation_stage.js";
import SeamAllowanceStage from "../annotation_stages/seam_allowance_stage.js";*/
import BasicBaseStage from "../basic_pattern_stages/basic_pattern_stage.js";
import DartBaseStage from "../basic_pattern_stages/dart_pattern_stage.js";




export default class EasyPatternMainCorpusStage extends SequentialStage{
    constructor(){
        super();
        this.add_stage(DartBaseStage);        
    }
    
    on_enter(){
        super.on_enter();
     //   this.call_substage_method("two_waistline_darts");
        
        //      Dangerous: this.call_stage_method("two_waistline_darts");
        // Also Dangerous: this.stages[0].two_waistline_darts(); (Unexpected results if stage not currently entered)
    }
    

    
    // Die Art und weise, wie zum anderen Taillenabnäher gewechselt wird, 
    // ist nicht sonderlich elegant und sollte vorerst vermutlich lieber vermieden werden
    // zumindest bei Schulter, Armpit und neckline
    single_dart(position, switch_to_outer_waistline_dart = false) {
        //this.process_log();
        
        switch (position) {
            case "shoulder":
                this.call_substage_method("split_up_dart", [["shoulder", 0.7, 1]]);
                break;
            case "french":
                this.call_substage_method("split_up_dart", [["side", 0.9, 1]]);
                break;
            case "side":
                this.call_substage_method("split_up_dart", [["side", 0.3, 1]]);
                break;
            case "armpit":
                this.call_substage_method("split_up_dart", [["armpit", 0.7, 1]]);
                break;
            case "neckline":
                this.call_substage_method("split_up_dart", [["neckline", 0.7, 1]]);
                break;
            case "outer": //outer waistline dart
                this.call_substage_method("split_up_dart", [["side", 0.5, 1]]);
                this.call_substage_method("move_dart_number_to_darttip", [1, "p", true]);
                this.call_substage_method("remove_inner_waistline_dart");
                this.call_substage_method("split_dart_number_to_bottom", [1]);
                this.call_substage_method("merge_to_waistline_dart", [1]);
                return;
            case "waistline": // inner waistline dart
                this.call_substage_method("split_up_dart", [["side", 0.5, 1]]);
                this.call_substage_method("remove_outer_waistline_dart");
                this.call_substage_method("split_dart_number_to_bottom", [1]);
                this.call_substage_method("merge_to_waistline_dart", [1, false]);
                return;

            default:
                break;
        }
        if(switch_to_outer_waistline_dart){
            this.call_substage_method("move_dart_number_to_darttip", [1]);
        }
        this.call_substage_method("remove_waistline_darts");
    };

// Im Moment noch nicht die Möglichkeit irgendwas mit Waistline zu machen 
// Im Moment nur mit 2 und 3 Abnähern an einer Position
    multiple_dart_one_location(position, number_of_splits, switch_to_outer_waistline_dart = false){

        switch (position) {
            case "shoulder":
                if(number_of_splits == 2){
                    this.call_substage_method("split_up_dart", [["shoulder", 0.7, 0.6], ["shoulder", 0.3, 0.4]]);
                } else if (number_of_splits == 3){
                    this.call_substage_method("split_up_dart", [["shoulder", 0.7, 0.4], ["shoulder", 0.4, 0.3], ["shoulder", 0.2, 0.3]]);
                }
                break;
            case "french":
                if (number_of_splits == 2) {
                    this.call_substage_method("split_up_dart", [["side", 0.9, 0.6], ["side", 0.7, 0.4]]);
                } else if (number_of_splits == 3) {
                    this.call_substage_method("split_up_dart", [["side", 0.9, 0.4], ["side", 0.7, 0.3], ["side", 0.6, 0.3]]);
                }
                break;
            case "side":
                if (number_of_splits == 2) {
                    this.call_substage_method("split_up_dart", [["side", 0.4, 0.6], ["side", 0.2, 0.4]]);
                } else if (number_of_splits == 3) {
                    this.call_substage_method("split_up_dart", [["side", 0.4, 0.4], ["side", 0.3, 0.3], ["side", 0.2, 0.3]]);
                } 
                break;
            case "armpit":
                if (number_of_splits == 2) {
                    this.call_substage_method("split_up_dart", [["armpit", 0.9, 0.6], ["armpit", 0.7, 0.4]]);
                } else if (number_of_splits == 3) {
                    this.call_substage_method("split_up_dart", [["armpit", 0.9, 0.4], ["armpit", 0.8, 0.3], ["armpit", 0.7, 0.3]]);
                } 
                break;
            case "neckline":
                if (number_of_splits == 2) {
                    this.call_substage_method("split_up_dart", [["neckline", 0.7, 0.6], ["neckline", 0.5, 0.4]]);
                } else if (number_of_splits == 3) {
                    this.call_substage_method("split_up_dart", [["neckline", 0.8, 0.4], ["neckline", 0.65, 0.3], ["neckline", 0.5, 0.3]]);
                }
                break;
            default:
                break;
        }
        if (switch_to_outer_waistline_dart) {
            this.call_substage_method("move_dart_number_to_darttip", [1]);
            this.call_substage_method("move_dart_number_to_darttip", [2]);
            if(number_of_splits == 3){
                this.call_substage_method("move_dart_number_to_darttip", [3]);
            }
        }
      //  this.call_substage_method("remove_waistline_darts");
    }

    remove_waistline_dart(position){
        switch (position) {
            case "both":
                this.call_substage_method("remove_waistline_darts");

                break;
            case "inner":
                this.call_substage_method("remove_inner_waistline_dart");

                break;
            case "outer":
                this.call_substage_method("remove_outer_waistline_dart");

                break;
            default:
                break;
        }
    }

    waistline_dart(position){
        switch (position) {
            case "outer":
                //this.call_substage_method("split_up_dart", [["armpit", 0.8, 1]]);
                this.call_substage_method("shirt_without_dart");
                this.call_substage_method("remove_inner_waistline_dart");

                break;
            case "inner":
                this.call_substage_method("shirt_without_dart");
                this.call_substage_method("remove_outer_waistline_dart");
                break;
            case "both":
                this.call_substage_method("shirt_without_dart");
                break;
            case "none":
                this.call_substage_method("shirt_without_dart");
                this.call_substage_method("remove_waistline_darts");
                break;
            default:
                break;
        }
    }

    styleline(position, switch_to_outer_waistline_dart = false){
        switch (position) {
            case "armpit":
                this.call_substage_method("split_up_dart", [["armpit", 0.6, 1]]);
                break;
            case "shoulder":
                this.call_substage_method("split_up_dart", [["shoulder", 0.7, 1]]);
                break;

            default:
                break;
        }
        if(switch_to_outer_waistline_dart){
            this.call_substage_method("move_dart_number_to_darttip", [1]);
            this.call_substage_method("remove_inner_waistline_dart");
        } else {
            this.call_substage_method("remove_outer_waistline_dart");
        }
        this.call_substage_method("split_dart_number_to_bottom", [1]);
    }

    // spezielle Funktion für genau zwei Abnäher an zwei verschiedenen Positionen
    multiple_dart_different_location(position1, position2){

        if(position1 == "shoulder"){

            switch (position2) {
                case "french":
                    this.call_substage_method("split_up_dart", [["shoulder", 0.7, 0.5], ["side", 0.9, 0.5]]);
                    break;
                case "side":
                    this.call_substage_method("split_up_dart", [["shoulder", 0.7, 0.5], ["side", 0.3, 0.5]]);
                    break;
                case "armpit":
                    this.call_substage_method("split_up_dart", [["shoulder", 0.7, 0.5], ["armpit", 0.7, 0.5]]);
                    break;
                case "neckline":
                    this.call_substage_method("split_up_dart", [["shoulder", 0.7, 0.5], ["neckline", 0.7, 0.5]]);
                    break;
                default:
                    break;
            }
        } else { // Nimmt an, Waistline ist das andere

            switch(position2){
                case "shoulder":
                    this.call_substage_method("split_up_dart", [["shoulder", 0.7, 1]]);
                    break;
                case "french":
                    this.call_substage_method("split_up_dart", [["side", 0.9, 1]]);
                    break;
                case "side":
                    this.call_substage_method("split_up_dart", [["side", 0.3, 1]]);
                    break;
                case "armpit":
                    this.call_substage_method("split_up_dart", [["armpit", 0.7, 1]]);
                    break;
                case "neckline":
                    this.call_substage_method("split_up_dart", [["neckline", 0.7, 1]]);
                    break;
                default:
                    break;
            }
    }
    }
}