import StageProcess from "../Core/Stages/stageProcess.js";
import CurveLinesStage from "./stages/annotation_stages/curve_stage.js";
import CurveBottomCutStage from "./stages/annotation_stages/curve_bottom_split_stage.js";
import DartAnnotationStage from "./stages/annotation_stages/dart_annotation_stage.js";
import SeamAllowanceStage from "./stages/annotation_stages/seam_allowance_stage.js";
import EasyPatternMainCorpusStage from "./stages/easy_pattern_stages/easy_pattern_stage_front_and_back.js";
import EasyPatternNecklineStage from "./stages/easy_pattern_stages/easy_pattern_stage_neckline.js";

import Sketch from "../Core/StoffLib/sketch.js";
import CutLengthStage from "./stages/annotation_stages/cut_length_stage.js";
import BasicSleeveBaseStage from "./stages/basic_pattern_stages/basic_sleeve_pattern_stage.js";

import {
    fancy_main_pattern_construction,
    fancy_main_sleeve_pattern_construction,
} from "./stages/fancyPattern/main_fancy_pattern.js";
import { at_url } from "../Core/Debug/render_at.js";

let measurements = {
    over_bust_front: 48.5,
    over_bust_back: 41.5,
    belly_front: 55,
    belly_back: 43.5,
    // Julya
    //"belly": 98.5,
    shoulder_length: 13,
    shoulder_width: 41.5,
    bust_width: 100,
    under_bust: 89.5,
    bust_point_width: 23,
    bust_point_height: 12,
    side_height: 15.5,
    waist_height: 22,
    waist_width: 89,
    shoulder_height_front: 40.5,
    center_height_front: 30,
    diagonal_front: 40.5,
    across_front: 32,
    bottom_width_front: 57,
    shoulderblade_width: 16,
    shoulderblade_height: 19,
    shoulder_height_back: 40,
    center_height_back: 35.5,
    diagonal_back: 41,
    across_back: 33.5,
    bottom_width_back: 60,
    arm: 34,
    "arm length": 53,
    wristwidth: 15,
    ellbow_width: 24,
    ellbow_length: 29.5,
};

export function main_pattern_start(mea, design_data, side) {
    //Sketch.dev.global_recording().hot_at_url("/hot");
    const shirt = new StageProcess({
        measurements: mea,
        ease: design_data.basic.ease,
        side: side,
    });

    let needed_base_type;
    let fabric_adjustment_needed;
    if (side == "front") {
        needed_base_type = design_data.front.base_type;
        design_data.basic.fabric_adjustment_needed =
            design_data.front.fabric_adjustment_needed;
    } else {
        needed_base_type = design_data.back.base_type;
        design_data.basic.fabric_adjustment_needed =
            design_data.back.fabric_adjustment_needed;
    }

    design_data.front.additional.manipulation_distance =
        (mea.bust_point_width / 2) * 0.85;
    design_data.back.additional.manipulation_distance =
        (mea.shoulderblade_width / 2) * 0.85;

    shirt.add_stage(
        new EasyPatternNecklineStage(
            design_data.basic.one_waistline_dart,
            design_data.basic,
            side,
            needed_base_type
        )
    );
    shirt.add_stage(EasyPatternMainCorpusStage);

    //console.log(design_data)

    switch (design_data.front.neckline) {
        case "round":
            shirt.neckline("round");
            break;
        case "round_wide":
            shirt.widen_neckline(0.6);
            shirt.deepen_neckline(0.15);
            shirt.neckline("round");
            break;
        case "round_deep":
            shirt.deepen_neckline(0.6);
            shirt.neckline("round");
            break;
        case "v_line":
            shirt.neckline("v-line");
            break;
        case "v_line_deep":
            shirt.deepen_neckline(0.5);
            shirt.neckline("v-line");
            break;
        case "v_line_wide":
            shirt.widen_neckline(0.6);
            shirt.neckline("v-line");
            break;
        case "square":
            shirt.widen_neckline(0.2);
            shirt.neckline("square");
            break;
        case "round_boat":
            shirt.widen_neckline(0.9);
            shirt.neckline("round");
            break;
        default:
            shirt.neckline("round");
            console.log("Dieser Ausschnitt existiert noch nicht!");
            break;
    }

    // ToDo: Hier müsste ein Cut rein um Typ 3 Sinnvoll zu bauen

    /*
    let number_of_darts = 1; // Zählt Taillenabnäher nicht mit!!!
    let swap_orientation = false;
    switch (design_data.dartAllocation.type) {
        case "without dart":
            number_of_darts = 0;
            shirt.waistline_dart("none");
            break;
        case "single dart":
            shirt.single_dart(design_data.dartAllocation.position);
            if (design_data.dartAllocation.position == "waistline" || design_data.dartAllocation.position == "outer"){
                number_of_darts = 0;
                shirt.curve_cut_waistline_dart();
            } else if (design_data.dartAllocation.position == "shoulder"){
                swap_orientation = true;
            }
            break;
        case "double dart":
            switch (design_data.dartAllocation.position) {
                case "waistline and side":
                    shirt.multiple_dart_different_location("waistline", "side");
                    shirt.remove_waistline_dart("outer");
                    shirt.curve_inner_waistline_dart("inner");
                    break;
                case "waistline and french":
                    shirt.multiple_dart_different_location("waistline", "french");
                    shirt.remove_waistline_dart("outer");
                    shirt.curve_inner_waistline_dart("inner");
                    break;
                case "waistline and shoulder":
                    shirt.multiple_dart_different_location("waistline", "shoulder");
                    shirt.remove_waistline_dart("outer");
                    shirt.curve_inner_waistline_dart("inner");
                    break;
                case "waistline and armpit":
                    shirt.multiple_dart_different_location("waistline", "armpit");
                    shirt.remove_waistline_dart("outer");
                    shirt.curve_inner_waistline_dart("inner");
                    break;
                case "waistline and neckline":
                    shirt.multiple_dart_different_location("waistline", "neckline");
                    shirt.remove_waistline_dart("outer");
                    shirt.curve_inner_waistline_dart("inner");
                    break;
                case "shoulder and side":
                    number_of_darts = 2;
                    swap_orientation = true;
                    shirt.multiple_dart_different_location("shoulder", "side");
                    shirt.remove_waistline_dart("both");
                    break;
                case "shoulder and french":
                    number_of_darts = 2;
                    swap_orientation = true;
                    shirt.multiple_dart_different_location("shoulder", "french");
                    shirt.remove_waistline_dart("both");
                    break;
                case "shoulder and neckline":
                    number_of_darts = 2;
                    shirt.multiple_dart_different_location("shoulder", "neckline");
                    shirt.remove_waistline_dart("both");
                    break;
                case "shoulder and armpit":
                    number_of_darts = 2;
                    swap_orientation = true;
                    shirt.multiple_dart_different_location("shoulder", "armpit");
                    shirt.remove_waistline_dart("both");
                    break;
                default:
                    shirt.single_dart(design_data.dartAllocation.position);
                    if (design_data.dartAllocation.position == "waistline" || design_data.dartAllocation.position == "outer") {
                        number_of_darts = 0;
                        shirt.curve_cut_waistline_dart();
                    } else if (design_data.dartAllocation.position == "shoulder") {
                        swap_orientation = true;
                    }
                    break;
            }
            break;
        case "multiple darts":
            if (design_data.dartAllocation.position == "waistline"){
                number_of_darts = 0;
                shirt.waistline_dart("both");
                shirt.curve_inner_waistline_dart();
            } else {
                number_of_darts = design_data.dartAllocation.multiple_darts_number;
                shirt.multiple_dart_one_location(design_data.dartAllocation.position, design_data.dartAllocation.multiple_darts_number);
                shirt.remove_waistline_dart("both");
            }
            break;
        case "styleline":
            number_of_darts = 0;
            if (design_data.dartAllocation.styleline_type == "classic princess"){
                shirt.styleline("shoulder");
            } else {
                shirt.styleline("armpit");
            }
            shirt.curve_styleline();
            break;
        default:
            break;
    }

*/
    //shirt.multiple_dart_one_location("shoulder", 2);
    //shirt.remove_waistline_dart("both");

    shirt.draw_darts(design_data);

    return shirt;
}

export function main_pattern_finish(shirt, side, design_data) {
    // shirt as StageProcess

    shirt.add_stage(CurveBottomCutStage);

    shirt.add_stage(CurveLinesStage);
    shirt.add_stage(DartAnnotationStage);

    shirt.add_stage(CutLengthStage);

    shirt.add_stage(SeamAllowanceStage);

    at_url(shirt.get_working_data().sketch, "/bla");
    shirt.curve_side();
    shirt.complete_fold();

    // shirt.cut_length(design_data.length);
    // TODO: Spezialfälle!!!

    let number_of_darts;
    let config;
    if (side == "front") {
        number_of_darts = design_data.front.darts.length;
        config = design_data.front;
    } else {
        number_of_darts = design_data.back.darts.length;
        config = design_data.back;
    }

    shirt.manipulate_darts(config);

    for (let i = 1; i <= number_of_darts; i++) {
        shirt.move_dart_outside(i, 5);
        shirt.fill_in_dart(i);
        shirt.dart_annotation(i, 3);
    }

    shirt.move_waistline_dart(4.5);
    shirt.annotate_waistline_dart();

    /*
  shirt.fill_in_dart(1);
  shirt.move_dart_outside(1, 4);
  shirt.dart_annotation(1, 3);

  shirt.set_seam_allowance("shoulder", 0.5)
  shirt.set_seam_allowance("bottom", 5)
  */

    /*
  if (design_data.dartAllocation.type == "styleline"){

      if (design_data.dartAllocation.styleline_type == "panel"){
          shirt.styleline_seam_allowance();
      } else {
          shirt.styleline_seam_allowance();
      }

  }

  shirt.seam_allowance_temp(swap_orientation);
  */
    return shirt.finish();
}

export function main_pattern_construction(mea, design_data, side) {
    const shirt = main_pattern_start(mea, design_data, side);

    if (design_data.basic.additional.fancy) {
        return fancy_main_pattern_construction(shirt, design_data);
    } else {
        return main_pattern_finish(shirt, side, design_data);
    }
}

export function main_sleeve_pattern_start(wd, design_data) {
    const sleeve = new StageProcess({
        measurements: wd.measurements,
        ease: wd.ease,
    });

    sleeve.add_stage(BasicSleeveBaseStage);

    design_data.sleeve.length = 1 - design_data.sleeve.length;

    switch (design_data.sleeve.type) {
        case "straight":
            sleeve.cut_length(design_data.sleeve.length);
            break;
        case "slim":
            sleeve.slim_sleeve(4);
            sleeve.cut_length(design_data.sleeve.length);
            break;
        case "extra slim":
            sleeve.slim_sleeve(
                wd.measurements.arm - wd.measurements.wristwidth
            );
            sleeve.cut_length(design_data.sleeve.length);
            break;
        case "casual":
            sleeve.casual_sleeve(2 / 3);
            sleeve.cut_length(design_data.sleeve.length);
            break;

        case "puffy_both":
            sleeve.cut_length(design_data.sleeve.length);
            sleeve.flare_straight(10);
            sleeve.add_wristband(1.5);
            break;
        case "puffy_top":
            sleeve.cut_length(design_data.sleeve.length);
            sleeve.cut_sleeve_stripes(20);
            sleeve.flare_top_sleeve(1.5);
            sleeve.connect_sleeve_top(4);
            break;
        case "puffy_bottom":
            sleeve.cut_length(design_data.sleeve.length);
            sleeve.cut_sleeve_stripes(20);
            sleeve.flare_bottom_sleeve(1.5);
            sleeve.connect_sleeve_bottom(4);
            sleeve.add_wristband(1.5);
            break;
        case "flared":
            sleeve.cut_length(design_data.sleeve.length);
            sleeve.cut_sleeve_stripes(21);
            if (!design_data.sleeve.additional.flare_distance) {
                if (design_data.sleeve.length < 0.3) {
                    sleeve.flare_bottom_sleeve(10, true);
                } else if (design_data.sleeve.length < 0.6) {
                    sleeve.flare_bottom_sleeve(6, true);
                } else if (design_data.sleeve.length < 0.8) {
                    sleeve.flare_bottom_sleeve(4, true);
                } else {
                    sleeve.flare_bottom_sleeve(2, true);
                }
            } else {
                sleeve.flare_bottom_sleeve(
                    design_data.sleeve.additional.flare_distance,
                    true
                );
            }
            sleeve.connect_sleeve_bottom(4);
            break;
        case "ruffles":
            sleeve.ruffles();
            break;
        case "latern":
            sleeve.cut_to_other_sketch(design_data.sleeve.length);
            sleeve.latern_sleeve(5);
            break;

        default:
            break;
    }

    //sleeve.add_stage(BasicSleeveBaseStage);
    //  sleeve.ruffles();
    /*
    sleeve.cut_length(0.5);
    sleeve.cut_sleeve_stripes(20);
    sleeve.add_wristband();
    */
    //  sleeve.flare_straight(20);
    //  sleeve.slim_sleeve(20);
    //    sleeve.cut_to_other_sketch(0.35);
    //    sleeve.latern_sleeve(4);

    //  sleeve.cut_sleeve_stripes(11);
    /*
    sleeve.flare_top_sleeve(1);
    sleeve.connect_sleeve_top(1);
*/
    return sleeve;
}

export function main_sleeve_construction(wd, design_data) {
    const sleeve = main_sleeve_pattern_start(wd, design_data);

    if (design_data.sleeve.additional.fancy) {
        return fancy_main_sleeve_pattern_construction(sleeve);
    } else {
        return sleeve.finish();
    }
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
    half = half - mea.arm / 2;
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
}
