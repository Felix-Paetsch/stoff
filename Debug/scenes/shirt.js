import PatternConstructor from "../../PatternLib/patternConstructor.js";
import BasicPatternStage from "../../Patterns_new/stages/basic_pattern_stage.js";

let measurements = {
    "shoulder_length": 15.5,
    "shoulder_width": 47,
    "bust_width": 97.5,
    "under_bust": 94,
    "bust_point_width": 24,
    "bust_point_height": 15,
    "side_height": 19,
    "waist_height": 26,
    "waist_width": 95,
    "belly": 99.5,
    "shoulder_height_front": 44.5,
    "center_height_front": 34,
    "diagonal_front": 44,
    "across_front": 34,
    "bottom_width_front": 47.5,
    "shoulderblade_width": 16.5,
    "shoulderblade_height": 21,
    "shoulder_height_back": 46,
    "center_height_back": 41.5,
    "diagonal_back": 45.5,
    "across_back": 36.5,
    "bottom_width_back": 52,
    "arm": 32,
    "arm length": 60.5,
    "wristwidth": 16,
    "ellbow_width": 28,
    "ellbow_length": 35
}


export default function(){
    const shirt = new PatternConstructor(calculate_measurements(measurements));
    shirt.set_working_data({
        ease: 2
    });
    
    shirt.add_patter_stage(BasicPatternStage);
    return shirt.finish();
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
    mea.across_front = mea.ratio * mea.under_bust / 2;
    mea.across_back = mea.under_bust - mea.across_front;
    mea.across_front = mea.across_front - (mea.arm / 2) + 4;
    mea.across_back = mea.across_back - (mea.arm / 2) + 4;
    /*
   */
    return mea;
};