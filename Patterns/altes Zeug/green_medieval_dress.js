const {correct_armmeasurements, sleevetype, cut_sleeve} = require("./arm.js");
const {front, back, adjust_back_shoulder} = require("./clothes/basicPattern.js");
const { debug, add_point, Point, save , remove_point, remove_line, line_between_points} = require("./StoffLib/main.js");
const {point_at, lotpunkt, lotpunkt2} = require("./clothes/basicFun_new.js");
const {puffy_down, add_wristband} = require("./sleeves/puffy.js");
const {side_to_tai} = require("./clothes/darts.js");
const {cut_back, cut_front, connect_sides} = require("./clothes/cuts.js");
const {lengthen_mid_without_armpit, tai_parts, mid_lengthen} = require("./clothes/lengthen.js");


const cloth_type = {
  // 4,5 Abnaeher bei Koerbchengroesse B (over_bust)
  // + differenz bei anderer koerbchengroesse
  //abnaeher: 3.65,
  //side_dart: true,
  //line_rotated_to: "side",//"shoulder", "armpit", "side", "tai", "height1", "height2", "neckline"
  //degree: 0,
  front_shoulder_procentage: 0.3, //
  back_shoulder_procentage: 0.41, // 0.36
  depth_neckline: 0.43, //  0.29
  back_dart_shift: 1, // 0 false (abstand 1/2 bust_point_distance), 1 wird back_dart_distance genutzt
  back_dart_distance: 24,
  front_dart_rotation: false,
  sleevetype: "hemd", // eingehalten, hemd
  height: 2, // to 3
  freedom: 6,
  width_wristband: 3,
  part_front_dart: 0.45,
  part_back_dart: 0.50,
  back_sho_1_percent: 0

};





const leonie = {
   bust: 92,
   over_bust: 88,
   bust_diff: 0,
   tai: 77,
   po: 99,
   height: 43,
   shoulder_l: 46,
   shoulder_b: 44, // just for controll
   tai_height: 23,
   ausschnitt_min: 53,
   back_ausschnitt: 0,
   front_ausschnitt: 0,
   ausschnitt_ges: 0,
   depth_neckline: 0.29, // eher bei ct genutzt
   front_shoulder: 0,
   back_shoulder: 0,
   front_side: 0,
   back_side: 0,
   bust_point: 0,
   back_point: 0,
   bust_point_height: 26,
   bust_point_distance: 20,
   armwidth: 30,
   armlength:52 + 4,
   arm_front: 0,
   arm_back: 0,
   arm_mind: 40,
   armball_height: 0,
   ellbow_width: 27, // just for controll
   ellbow_length: 42, // just for controll
   wristwidth: 20,
   vorn_armk_hoehe: 0,
   rueck_armk_hoehe: 0,
   durchschn_armkugel_hoehe: 0
};

meassures = leonie;

meassures.tai = meassures.bust;

meassures.bust_diff = meassures.bust - meassures.over_bust;
back_returns = back(meassures, cloth_type, 0, 0);

front_returns = front(meassures, cloth_type, 70, 0);

adjust_back_shoulder(back_returns, meassures, cloth_type);
meassures.ausschnitt_ges = (meassures.front_ausschnitt + meassures.back_ausschnitt) * 2;
sleevetype(meassures, cloth_type);
const sleeve = correct_armmeasurements(meassures, -60, (meassures.height/2));
//cut_sleeve(sleeve, );

puffy_down(sleeve, 20);


add_wristband(meassures, cloth_type, -45, 0);

//side_to_tai(front_returns, cloth_type);

temp = cut_back(back_returns, cloth_type);
back_mid = temp.mid;
back_side = temp.side;

temp = cut_front(front_returns, cloth_type);
front_mid = temp.mid;
front_side = temp.side;

mid = connect_sides(back_side, front_side);


percent = tai_parts([back_mid, front_mid, mid], meassures);
lengthen_mid_without_armpit(back_mid, meassures, cloth_type, percent[0], -1);
lengthen_mid_without_armpit(front_mid, meassures, cloth_type, percent[1], 1);
mid_lengthen(mid, meassures, cloth_type, percent[2]);

console.log("front_side", meassures.front_side);
console.log("back_side", meassures.back_side);


save.a4();
//save.svg(`out.svg`, 500, 500);
