import PatternConstructor from "../../PatternLib/patternConstructor.js";
import BasicPatternStage from "../../Patterns_new/stages/basic_pattern_stage.js";

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
    console.log(mea.ratio)
    half = half - (mea.arm / 2);
    mea.across_front = mea.ratio * half;
    mea.across_back = half + (half - mea.across_front);
    console.log(mea.across_front)
    console.log(mea.across_back)
    //console.log(2 - mea.ratio)
    mea.across_front = mea.across_front + 4;
    mea.across_back = mea.across_back + 6;
    /*
    */
    return mea;
};