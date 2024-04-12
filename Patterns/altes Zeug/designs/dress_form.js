
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




/* eingestellt auf:
(links wenn man es selbst an hat)

Hals: p2
brust
  vorn: 92
  hinten: 92
  links: 88
  rechts: 88

taille
  vorn: 72
  hinten: 72
  links: 74
  rechts: 74

po:
  vorn: 94
  hinten: 94
  links: 100
  rechts: 100

*/

const dressForm = {
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
