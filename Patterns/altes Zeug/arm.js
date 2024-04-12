const { debug, add_point, remove_point, line_between_points, interpolate_lines, Point, save, remove_line, clear } = require("./StoffLib/main.js");
const { Vector } = require("./Geometry/geometry.js");
const { get_orth_line_length, deepen_neckline, line_with_length, point_at, side , shoulder, lotpunkt, armpit, round_neckline, smooth_out} = require("./clothes/basicFun_new.js");
const { rotate_dart, tai_sho_dart, cut_line, rotate_point, scale_line, rotate_abnaeher, add_abnaeher_side, scale_dart, bust_dart} = require("./clothes/abnaeher.js");

/*
// --- lokal dann in der eigentlichen Datei, dann hierher übergeben und nicht hier
const cloth_type = {
  abnaeher: 4,
  side_dart: true,
  line_rotated_to: "neckline",//"shoulder", "armpit", "side", "tai", "height1", "height2", "neckline"
  degree: 100
};

const measurements = {
   bust: 90,
   tai: 75,
   po: 100,
   height: 45,
   shoulder_l: 44,
   tai_height: 25,
   bust_point: 0,
//   back_point: add_point(new Point(10, 25)),
   armwidth: 30,
   armlength:50,
   arm_front: 23.85,
   arm_back: 22.79,
   armball_height: 13,
   wristwidth: 18
};
*/
//measurements.bust_point = add_point(new Point(67, (((measurements.height+cloth_type.abnaeher)/2)+2)))

// ------
//correct_armmeasurements(measurements, 0, 0);

function correct_armmeasurements(mea, x, y){
  let temp = arm(mea, x, y);
  let arm_pat = temp.curves;
  let width = temp.width;
  let counter = 0;
  //console.log("measurements front", mea.arm_front, "arm", arm_pat[0].get_length());

  while ((mea.arm_front > arm_pat[1].get_length()) || (mea.arm_back > arm_pat[0].get_length())){ // front hat die geringere Länge
    move_point(arm_pat[0].p1, width[0], -1);
    move_point(arm_pat[1].p1, width[1], 1);
    counter++;
  }


  mea.armwidth = width[0].get_length() + width[1].get_length();
  console.log("measurements front", mea.arm_front, "arm", arm_pat[0].get_length());
  console.log("measurements back", mea.arm_back, "arm", arm_pat[1].get_length());
  console.log("armwidth", mea.armwidth);
  console.log("counter", counter);
  console.log("front_and_back", mea.vorn_armk_hoehe, mea.rueck_armk_hoehe);
  console.log("armball_height", mea.armball_height);

  //remove_point(arm_pat[1].p1);
  return temp;
}



function arm(mea, x, y){
  const start = add_point(new Point(x, y));
  let width = line_with_length(start, mea.armwidth, -90);
  let temp = point_at(width, 0.525);
  width = [temp.l1_segment, temp.l2_segment];
  const length = line_with_length(temp.point, mea.armlength, 0);
  const heigth = line_with_length(temp.point, mea.armball_height, 180);
  const wrist_left = line_with_length(length.p2, (mea.wristwidth*0.525),90);
  wrist_left.swap_orientation();
  const wrist_right = line_with_length(length.p2, (mea.wristwidth*0.475),-90);
  const outer_line_left = line_between_points(width[0].p1, wrist_left.p1);
  const outer_line_right = line_between_points(width[1].p2, wrist_right.p2);

  const bla = curve(width[0].p1, heigth.p2, width[0]);
  const bla2 = curve(width[1].p2, heigth.p2, width[1], -1);
  //console.log(bla.get_length());

  return {
      curves: [bla, bla2],
      width,
      middle_line: length,
      left_line: outer_line_left,
      right_line: outer_line_right,
      wrist_left,
      wrist_right
  };

}


function curve(p1, p2, ln, r = 1){
  const vec = ln.get_line_vector();
  const p1_vec = p1.add(vec.scale(r));
  const p1_h = add_point(new Point(p1_vec.x, p1_vec.y));
  const ln1 = line_between_points(p1, p1_h);

  const p2_vec = p2.subtract(vec.scale(r));
  const p2_h = add_point(new Point(p2_vec.x, p2_vec.y));
  const ln2 = line_between_points(p2, p2_h);

  const inter = interpolate_lines(ln1, ln2, 2, (x) => Math.pow(x, 2), (x) => Math.pow(x, 0.9), (x)=> Math.pow(x, 5));
  const inter2 = smooth_out(inter, ln2, 2, 0, 2);
  remove_line(inter);
  //console.log("2",inter2.get_length());
  remove_point(ln2.p2);
  remove_point(ln1.p2);

  return inter2;

}

function move_point(pt, ln, r = 1){
  const vec = pt.add(ln.get_line_vector().normalize().scale(r));
  return pt.moveTo(vec.x, vec.y);
}



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



//save(`arm_pattern.svg`, 500, 500);

module.exports = {correct_armmeasurements, sleevetype, cut_sleeve};
