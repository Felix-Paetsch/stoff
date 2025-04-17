import StageProcess from "../../../Core/Stages/stageProcess.js";
import BasicBaseStage from "../../../Patterns_new/stages/basic_pattern_stages/basic_pattern_stage.js";
import DartBaseStage from "../../../Patterns_new/stages/basic_pattern_stages/dart_pattern_stage.js";
import CurveLinesStage from "../../../Patterns_new/stages/annotation_stages/curve_stage.js";
import DartAnnotationStage from "../../../Patterns_new/stages/annotation_stages/dart_annotation_stage.js";
import SeamAllowanceStage from "../../../Patterns_new/stages/annotation_stages/seam_allowance_stage.js";
import Sketch from "../../../Core/StoffLib/sketch.js";
import EasyPatternMainCorpusStage from "../../../Patterns_new/stages/easy_pattern_stages/easy_pattern_stage_front_and_back.js";
import NecklineBaseStage from "../../../Patterns_new/stages/basic_pattern_stages/neckline_pattern_stage.js";
import EasyPatternNecklineStage from "../../../Patterns_new/stages/easy_pattern_stages/easy_pattern_stage_neckline.js";
//import EasyPatternFrontBackStages from "../../../Patterns_new/stages/easy_base_stages/easy_pattern_stage_front_and_back.js";
/*
let measurements = { // Puppe mit lustigen Maßen
    "shoulder_length": 13,
    "shoulder_width": 41,
    "bust_width": 93,
    "under_bust": 87.5,
    "bust_point_width": 22.5,
    "bust_point_height": 18.5,
    "side_height": 22,
    "waist_height": 17.5,
    "waist_width": 81.5,
    "belly": 87,
    "shoulder_height_front": 42,
    "center_height_front": 33,
    "diagonal_front": 43.5,
    "across_front": 0,
    "bottom_width_front": 46,
    "shoulderblade_width": 18.5,
    "shoulderblade_height": 20.5,
    "shoulder_height_back": 40.5,
    "center_height_back": 35,
    "diagonal_back": 40,
    "across_back": 0,
    "bottom_width_back": 44.5,
    "arm": 36,
    "arm length": 60.5,
    "wristwidth": 16,
    "ellbow_width": 28,
    "ellbow_length": 35
    }
*/
/*
let measurements = { // felix
    "shoulder_length": 16,
    "shoulder_width": 46,
    "bust_width": 91,
    "bust_width_front": 45,
    "bust_width_back": 46,
    "bust_point_width": 22,
    "bust_point_height": 18,
    "shoulderblade_width": 17,
    "shoulderblade_height": 20,
    "waist_width": 80,
    "waist_width_front": 43,
    "waist_width_back": 37,
    "waist_height": 26,
    "shoulder_height_front": 45,
    "shoulder_height_back": 45,
    "center_height_front": 32.5,
    "center_height_back": 43,
    "across_front": 37,
    "across_back": 36.5,
    "diagonal_front": 45,
    "diagonal_back": 45.5, // muss noch gemessen werden, nur spekuliert
    "side_height": 22,
    "bottom_width_front": 48,
    "bottom_width_back": 53,
    "under_bust": 83,
    "belly": 90,
    "arm": 35,
    "arm length": 61,
    "wristwidth": 23.5,
    "ellbow_width": 26,
    "ellbow_length": 35,
    "ratio": 0
}
*/

/*
let measurements = { //debby
    "shoulder_length": 15,
    "shoulder_width": 42,
    "shoulder_w_point": 45,
    "bust_width": 107,
    "bust_width_front": 55,
    "bust_width_back": 52,
    "bust_point_width": 23.5,
    "bust_point_height": 14.5,
    "shoulderblade_width": 16,
    "shoulderblade_height": 16.5,
    "waist_width_front": 51,
    "waist_width_back": 42,
    "waist_height": 27,
    "waist_width": 93,
    "shoulder_height_front": 46,
    "shoulder_height_back": 43,
    "center_height_front": 35,
    "center_height_back": 37.5,
    "diagonal_front": 48, // muss noch gemessen werden, nur spekuliert
    "diagonal_back": 45, // muss noch gemessen werden, nur spekuliert
    "across_front": 34,
    "across_back": 33.5,
    "side_height": 19.5,
    "bottom_width_front": 59,
    "bottom_width_back": 62,
    "under_bust": 93, // aktuell Felix' Maße, noch nachzureichen!!!
    "belly": 110, // aktuell Felix' Maße, noch nachzureichen!!!
    "arm": 40,
    "arm length": 61,
    "wristwidth": 23,
    "ellbow_width": 30,
    "ellbow_length": 34.5,
    "ratio": 0
    }
*/

let measurements = {
    "over_bust_front": 48.5,
    "over_bust_back": 41.5,
    "belly_front": 55,
    "belly_back": 43.5,
    // Julya
    //"belly": 98.5,
    "shoulder_length": 13,
    "shoulder_width": 41.5,
    "bust_width": 100,
    "under_bust": 89.5,
    "bust_point_width": 23,
    "bust_point_height": 12,
    "side_height": 15.5,
    "waist_height": 22,
    "waist_width": 89,
    "shoulder_height_front": 40.5,
    "center_height_front": 30,
    "diagonal_front": 40.5,
    "across_front": 32,
    "bottom_width_front": 57,
    "shoulderblade_width": 16,
    "shoulderblade_height": 19,
    "shoulder_height_back": 40,
    "center_height_back": 35.5,
    "diagonal_back": 41,
    "across_back": 33.5,
    "bottom_width_back": 60,
    "arm": 34,
    "arm length": 53,
    "wristwidth": 15,
    "ellbow_width": 24,
    "ellbow_length": 29.5
}


export default function(){
    const shirt = new StageProcess({
        measurements: calculate_measurements(measurements),
        ease: 2
    });
    shirt.add_stage(EasyPatternNecklineStage);
    shirt.add_stage(EasyPatternMainCorpusStage);
    shirt.add_stage(CurveLinesStage);
    shirt.add_stage(DartAnnotationStage);
    
    shirt.add_stage(SeamAllowanceStage);
    shirt.deepen_neckline(0.5)
    //shirt.widen_neckline(1)
    shirt.neckline("square");
    shirt.multiple_dart_one_location("shoulder", 2);
    shirt.remove_waistline_dart("both");
    

  //  shirt.waistline_dart("none");


   // shirt.styleline("shoulder", false);
    
   // shirt.move_dart("fold", 0.2);
   // shirt.move_dart_to_outer_waistline_dart()
    //  shirt.remove_outer_waistline_dart();
    // shirt.correct_second_dart();
   // shirt.split_up_dart(["shoulder", 0.9, 1]);
   // shirt.move_dart_number_to_darttip(1)
  // shirt.remove_waistline_darts();
    shirt.curve_side();
    shirt.complete_fold();
/*
   // shirt.split_at_dart();
   shirt.split_up_dart(["armpit", 0.6, 0.4], ["neckline", 0.8, 0.2], ["neckline", 0.95, 0.2], ["neckline", 0.6, 0.2]);
   
   shirt.move_dart_number_to_darttip(1, "p")
   //shirt.move_dart_number_to_darttip(2, "p")
   // shirt.split_dart_number_to_bottom(3, [2]);
   //shirt.split_dart_number_to_bottom(2);
   
   shirt.split_dart_number_to_bottom(1);
   
   //shirt.move_dart_outside(1, 0);
   shirt.remove_waistline_darts();
   // shirt.move_waistline_dart();
   shirt.curve_lines();
   shirt.curve_side();
   shirt.complete_fold();
   shirt.move_dart_outside(2, 4);
   shirt.move_dart_outside(3, 4);
   shirt.move_dart_outside(4, 4);
    shirt.fill_in_dart(2, false);
    shirt.fill_in_dart(3, false);
    shirt.fill_in_dart(4, false);
    shirt.dart_annotation(2, 3);
    shirt.dart_annotation(3, 3);
   shirt.dart_annotation(4, 3);
   */
   //shirt.set_seam_allowance("neckline", 0.5);
   //shirt.set_all_seam_allowance();
   // shirt.set_seam_allowance("armpit", 0.5);
   // shirt.set_seam_allowance("neckline", 0.5);
   // shirt.set_seam_allowance("bottom", 2.5);
    
 //  shirt.mirror();

   //shirt.fill_in_dart(3);
    //shirt.fill_in_dart(4);

/*
    shirt.fill_in_dart(1);
    shirt.move_dart_outside(1, 4);
    shirt.dart_annotation(1, 3);
    
    shirt.seam_allowance_temp();
    */

    return shirt.finish();
    
   /*
   let top = new StageProcess(calculate_measurements(measurements));
   top.set_working_data({
    ease: 2
   });
   //top.add_stage(EasyPatternFrontBackStages);

   return top.finish();
   */
}

function calculate_measurements(mea) {
    let half = mea.under_bust / 2;
    //console.log(half)
    mea.bust_width_front = mea.bust_width - (half + 2);
    //console.log(mea.waist_width_front);
    mea.bust_width_back = mea.bust_width - mea.bust_width_front;
    mea.waist_width_front = mea.waist_width - (half - 5);
    mea.waist_width_back = mea.waist_width - mea.waist_width_front;
    //console.log(mea.waist_width_back);
    mea.ratio = mea.bust_width_front / mea.bust_width_back;
 //   console.log(mea.ratio)
    half = half - (mea.arm / 2);
    mea.across_front = mea.ratio * half;
    mea.across_back = half + (half - mea.across_front);
  //  console.log(mea.across_front)
   // console.log(mea.across_back)
    //console.log(2 - mea.ratio)
    mea.across_front = mea.across_front + 4;
    mea.across_back = mea.across_back + 6;
    /*
    */
    return mea;
};
