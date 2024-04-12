const {correct_armmeasurements} = require("./arm.js");
const {front, back, adjust_back_shoulder} = require("./clothes/basicPattern.js");
const { debug, add_point, Point, save , remove_point, remove_line, line_between_points} = require("./StoffLib/main.js");
const {point_at, lotpunkt, lotpunkt2} = require("./clothes/basicFun_new.js")

/* generell Fälle abzudecken:
 Abnäher und dann die gestueckelten Linien als Laengen weitergeben


Wenn der Abnäher nach unten oder zur Seite (links) rotiert wird

Fragen des Tages (19.12.):
- warum kann ich depth_neckline nicht weiter als 0.43 senken?
- Was ist, wenn der Brustpunkt auf der Brustlinie oder darüber liegt?

*/


/*
const ba = {
  height: 0,
  tai: 0,
  side: 0,
  shoulder: 0,
  dart: 0,
  neck: 0,
  armpit: 0

}
*/

const cloth_type = {
  // 4,5 Abnaeher bei Koerbchengroesse B (over_bust)
  // + differenz bei anderer koerbchengroesse
  abnaeher: 3.65,
  side_dart: true,
  line_rotated_to: "side",//"shoulder", "armpit", "side", "tai", "height1", "height2", "neckline"
  degree: 0,
  front_shoulder_procentage: 0.3, //
  back_shoulder_procentage: 0.41, // 0.36
  depth_neckline: 0.43, //  0.29
  sleevetype: "eingehalten", // eingehalten, hemd
  height: 1, // to 3
  freedom: 4
};

const measurements = {
   bust: 90,
   tai: 75,
   po: 100,
   height: 45,
   shoulder_l: 44,
   tai_height: 25,
   front_shoulder: 0,
   back_shoulder: 0,
   front_side: 0,
   back_side: 0,
   bust_point: 0,
   back_point: 0,
   armwidth: 32,
   armlength:50,
   arm_front: 23.85,
   arm_back: 22.79,
   armball_height: 0,
   wristwidth: 18,
   vorn_armk_hoehe: 0,
   rueck_armk_hoehe: 0,
   durchschn_armkugel_hoehe: 0
};

const alex = {
   bust: 96,
   over_bust: 88,
   bust_diff: 0,
   tai: 81,
   po: 98,
   height: 45,
   shoulder_l: 50,
   shoulder_b: 45, // just for controll
   tai_height: 26,
   ausschnitt_min: 61,
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
   bust_point_distance: 23,
   armwidth: 32,
   armlength:67 + 4,
   arm_front: 0,
   arm_back: 0,
   arm_mind: 40,
   armball_height: 0,
   ellbow_width: 27, // just for controll
   ellbow_length: 42, // just for controll
   wristwidth: 22,
   vorn_armk_hoehe: 0,
   rueck_armk_hoehe: 0,
   durchschn_armkugel_hoehe: 0
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

const felix = {
   bust: 92.5,
   over_bust: 96,
   bust_diff: 0,
   tai: 80,
   po: 101,
   height: 42,
   shoulder_l: 50,
   shoulder_b1: 51, // just for controll
   shoulder_b2: 46, // just for controll
   tai_height: 26,
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
   bust_point_height: 25,
   bust_point_distance: 22,
   armwidth: 32,
   armlength:61 + 4,
   arm_front: 0,
   arm_back: 0,
   arm_mind: 40,
   armball_height: 0,
   ellbow_width: 26, // just for controll
   ellbow_length: 35, // just for controll
   wristwidth: 23.5,
   vorn_armk_hoehe: 0,
   rueck_armk_hoehe: 0,
   durchschn_armkugel_hoehe: 0
};

const felix_buch_front = {
  center_bodice_length: 35,
  full_bodice_length: 43,
  across: 37,
  shoulder_point_width: 46,
  full_bodice_width: 52, // 50
  shoulder_pitch: 43,
  shoulder_width: 16.5,
  neck: 31,
  shoulder_height: 40, //43
  side_bodice_length: 22,
  waist: 42, // 40
  bust_point_height: 18,
  bust_point_width: 22,
  hip: 44
};

// Die leere im Chaos der Kunst
const felix_buch_back = {
  center_bodice_length: 43,
  full_bodice_length: 48.5,
  across: 36.5,
  shoulder_point_width: 48,
  full_bodice_width: 50, //45
  shoulder_pitch: 49,
  shoulder_width: 16.5,
  neck: 20,
  shoulder_height: 41.5, //43
  side_bodice_length: 22,
  waist: 40, // 42
  bust_point_height: 21.5,
  bust_point_width: 17,
  hip: 49
};





// back_point: add_point(new Point(10, 25)),

//measurements.bust_point = add_point(new Point(52, (((measurements.height+cloth_type.abnaeher)/2)+2)))
meassures = leonie

meassures.bust_diff = meassures.bust - meassures.over_bust;
back_returns = back(meassures, cloth_type, 0, 0);

front(meassures, cloth_type, 60, 0);

adjust_back_shoulder(back_returns, meassures, cloth_type);
meassures.ausschnitt_ges = (meassures.front_ausschnitt + meassures.back_ausschnitt) * 2;
sleevetype(meassures, cloth_type);
const sleeve = correct_armmeasurements(meassures, -45, (meassures.armball_height));
cut_sleeve(sleeve, 0.20);


console.log("front_shoulder", meassures.front_shoulder);
console.log("back_shoulder", meassures.back_shoulder);
console.log("front_side", meassures.front_side);
console.log("back_side", meassures.back_side);
console.log("arm_back", meassures.arm_back);
console.log("arm_front", meassures.arm_front);
console.log("ausschnitt_gesammt", meassures.ausschnitt_ges);
console.log("armball_height", meassures.armball_height);
console.log("durchschn_armkugel_hoehe", meassures.durchschn_armkugel_hoehe);


// at the moment just height of the "armkugel"
function sleevetype(mea, cloth_type){
  mea.durchschn_armkugel_hoehe = (mea.vorn_armk_hoehe + mea.rueck_armk_hoehe)/2;

  switch (cloth_type.height) {
    case 1:
      if (cloth_type.sleevetype == "hemd") {
        mea.armball_height = (mea.durchschn_armkugel_hoehe * (3/4));
      } else {
        mea.arm_front += 1;
        mea.arm_back += 1;
        mea.armball_height = mea.durchschn_armkugel_hoehe * (5/6);
      }
      break;
    case 2:
      if (cloth_type.sleevetype == "hemd") {
        mea.armball_height = (mea.durchschn_armkugel_hoehe * (2/3));
      } else {
        mea.arm_front += 1;
        mea.arm_back += 1;
        mea.armball_height = mea.durchschn_armkugel_hoehe * (4/5);
      }
      break;
    case 3:
      if (cloth_type.sleevetype == "hemd") {
        mea.armball_height = (mea.durchschn_armkugel_hoehe * (1/2));
      } else {
        mea.arm_front += 1;
        mea.arm_back += 1;
        mea.armball_height = mea.durchschn_armkugel_hoehe * (3/4);
      }
      break;
    default:

  }
}


function cut_sleeve(sleeve, percent){
  const cut = point_at(sleeve.middle_line, percent);
  const p1 = lotpunkt2(cut.point, sleeve.middle_line, sleeve.left_line, -1);
  const p2 = lotpunkt2(cut.point, sleeve.middle_line, sleeve.right_line, 1);
  sleeve.left_line.p2.moveTo(p1.x, p1.y);
  sleeve.right_line.p2.moveTo(p2.x, p2.y);
  sleeve.middle_line.p2.moveTo(cut.point.x, cut.point.y);
  line_between_points(cut.l1_segment.p1,cut.l2_segment.p2);
  remove_point(cut.point);

//  const lot_left = add_point(new Point(vec.x, vec.y));

}

//save.a4();
save.svg(`out.svg`, 500, 500);
