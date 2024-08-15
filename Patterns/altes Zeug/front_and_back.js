import { debug, add_point, remove_point, line_between_points, interpolate_lines, intersect_lines, Point, save, remove_line, intersection_points } from './StoffLib/main.js';
import { Vector } from './Geometry/../StoffLib/geometry.js';
import { get_orth_line, get_orth_line_length, deepen_neckline, line_with_length, point_at, side , shoulder, lotpunkt, armpit, round_neckline, smooth_out} from './clothes/basicFun_new.js';
import { dart_new, rotate_dart, tai_sho_dart, cut_line, rotate_point, scale_line, rotate_abnaeher, add_abnaeher_side, scale_dart, bust_dart} from './clothes/abnaeher.js';

/* nächste Schritte:

- Funktion erstellen, der man Parameter gibt und
  welche die Abnäher an der richtigen Stelle automatisch erstellt

- überprüfen ob die Schultern vom Vorder und Rückteil gleich lang sind
- überprüfen ob die beiden Seiten von Vorne und Hinten gleich lang sind

- die ganzen Angaben von den Längen automatisieren
und in eine Funktion verpacken



- noch das rotieren fertig machen
  -> Verlängern nach Unten ist nicht für abnäher ausgelegt


- beim Taillenabnäher noch die untere Seite anpassen / erstellen

- Trennen von Schnittmustern und aufbauen von neuen Schnittmustern
  -> Interpolieren



irgendwann später:

- Ärmel designen

*/
// müsste durch Abstand der Brüste und
//Entfernung von der Schulter gemessen werden
/*
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
   back_point: add_point(new Point(10, 25))

};

measurements.bust_point = add_point(new Point(67, (((measurements.height+cloth_type.abnaeher)/2)+2)))



back(measurements, cloth_type, 0,0);
front(measurements, cloth_type, 75,0);
*/
function back(mea, ct, x, y){
  //start
  const start = add_point(new Point(x,y));
  let lines_height = line_with_length(start, mea.height, 0);

  //Taille

  const line_tai = line_with_length(lines_height.get_endpoints()[1], ((mea.tai + ct.freedom)/4), -90);
  const ps_bottom = line_tai.get_endpoints();
  let line_shoulder = shoulder(start, mea.shoulder_l, mea.height, 1);
  mea.back_point = genereate_bust_point(mea, lines_height, line_shoulder, line_tai, -1);
  // new Lines of height and bust line
  let temp = point_at(lines_height, 0.5);
  lines_height = [temp.l1_segment, temp.l2_segment];
  const line_bust = line_with_length(temp.point, (mea.bust/4) - (mea.bust_diff/3), -90);


  // closing line
  const line_side = side(line_bust.get_endpoints()[1], line_tai.get_endpoints()[1], lines_height[1]);


  const line_armpit = armpit(line_bust, line_shoulder, -3, 1);
  mea.arm_back = line_armpit.get_length();

  temp = round_neckline(ct, "back", lines_height[0], line_shoulder, 1);
  line_shoulder = temp.shoulder;
  const line_neck = temp.neckline;
  mea.back_ausschnitt = 15;//line_neck.get_length();


// abnaeher oben in der Schulter
  const lot_vec = lotpunkt(lines_height[1], mea.back_point, 1);
  const lot = add_point(new Point(lot_vec.x, lot_vec.y));
//  console.log(debug.sketch_has_line(line_shoulder));
  abnaeher_temp = (mea.shoulder_b - mea.shoulder_l) + 4;
  if (abnaeher_temp > 0){
    const dart = tai_sho_dart(mea.back_point, lot, line_shoulder, 105, abnaeher_temp);
    line_shoulder = dart.l_segments;
    mea.back_shoulder = line_shoulder[0].get_length() + line_shoulder[1].get_length();
  } else {
    mea.back_shoulder = line_shoulder.get_length();
  }
  remove_point(lot);
  remove_point(mea.back_point);

  const bottom = lengthen(mea, ps_bottom, -1, ct);
  //console.log("back", line_armpit.get_length());
  mea.rueck_armk_hoehe = armk_hoehe(line_armpit.p1, line_bust, 1);
  console.log(mea.back_shoulder, "hier");

  mea.back_side = bottom.line_side_outer.get_length() + line_side.get_length();

  return {
    neck: line_neck,
    shoulder: line_shoulder,
    heights: lines_height[0]
    }


}

function front(mea, ct, x,y){
  //start
  const start = add_point(new Point(x,y));
  let lines_height;
  if (ct.side_dart){
    lines_height = line_with_length(start, (mea.height + (ct.abnaeher)), 0);
  } else {
    lines_height = line_with_length(start, mea.height, 0);
  }

  //Taille
  const line_tai = line_with_length(lines_height.get_endpoints()[1], ((mea.tai + ct.freedom)/4), 90);
  const ps_bottom = line_tai.get_endpoints();

  let line_shoulder = shoulder(lines_height.p1, mea.shoulder_l, mea.height, 0);
  let l_line = line_with_length(line_shoulder.p1, line_shoulder.get_length(), 68);
  remove_point(l_line.p2);
  mea.bust_point = genereate_bust_point(mea, lines_height, l_line, line_tai, 1);


  // new Lines of height and bust line
  temp = point_at(lines_height, 0.46);
  lines_height = [temp.l1_segment, temp.l2_segment];
  len_bust_max = Math.max((((mea.bust + mea.bust_diff *2)/4) + ct.freedom /4), (mea.tai/4) + ct.freedom/4);
  const line_bust = line_with_length(temp.point, len_bust_max, 90);


  // closing line
  let line_side = side(line_bust.get_endpoints()[1], line_tai.get_endpoints()[1], lines_height[1]);
  temp = deepen_neckline(lines_height[0], ct.depth_neckline); // 0.28
  lines_height[0] = temp;


  let line_armpit = armpit(line_bust, line_shoulder, 2, -1);
  mea.arm_front = line_armpit.get_length();

  //console.log(debug.sketch_has_line(line_armpit));

  ct.front_shoulder_procentage = 1 -(mea.back_shoulder/(mea.shoulder_l/2));
  console.log(mea.back_shoulder, mea.shoulder_l, mea.back_shoulder/(mea.shoulder_l/2));
//  line_shoulder.set_color("blue");
//  console.log(neck_percent);
 abnaeher_temp = 4.5 + (mea.bust_diff + 2.5);
 temp = dart_new(mea.bust_point, line_bust, line_side, line_shoulder, abnaeher_temp);
 line_side = temp.side;
 lINE= line_between_points(temp.abnaeher[0].p2, temp.abnaeher[1].p2);
 console.log("Weite des Abnaehers", lINE.get_length());
 //line_shoulder = temp.shoulder;
// arm_p = smooth_out(line_armpit, line_bust);
 remove_line(line_armpit);
 //line_armpit = arm_p;

 //lo = lotpunkt(lines_height[0], line_armpit.p2, -1)
 //lo_p = add_point(new Point(lo.x, lo.y));
 //lo_l = line_between_points(line_armpit.p2, lo_p)
 line_armpit = armpit(line_bust, line_shoulder, 5, -1);
 //ar_p = smooth_out(a_p, lo_l, 2, 0);
 //remove_line(a_p)
 //remove_line(line_armpit)
 //a_p.p1.set_color("red")
 //a_p.set_color("blue")

  temp = round_neckline(ct, "front", lines_height[0], line_shoulder, -1);
  const line_neck = temp.neckline;
  mea.front_ausschnitt = line_neck.get_length();
  line_shoulder = temp.shoulder;

let t4;

  //remove_point(line_shoulder.p1);

// degree have to be >= 20!!!
// Ich gehe davon aus, dass -x genutzt wird, wenn die untere Seite von lines_height
// verwendet wird, und +x wenn der obere Teil genutzt werden soll.
let lines_between;
let richtung_linie;
let richtung_rotierend;
/*

if(ct.abnaeher > 0){
  //"shoulder", "armpit", "side", "tai", "height1", "height2", "neckline"
    switch (ct.line_rotated_to) {

      case "shoulder":
        lines_between = [line_armpit];
        richtung_linie = 1;
        richtung_rotierend = 1;
        ct.line_rotated_to = line_shoulder;
        break;
      case "armpit":
        lines_between = [];
        richtung_linie = 1;
        richtung_rotierend = 1;
        ct.line_rotated_to = line_armpit;
        break;
      case "tai":
        lines_between = [line_side];
        richtung_linie = 1;
        richtung_rotierend = -1;
        ct.line_rotated_to = line_tai;
        break;
      case "side":
        lines_between = [];
        richtung_linie = 1;
        richtung_rotierend = 1;
        ct.line_rotated_to = line_side;
        break;
      case "height1":
        lines_between = [line_armpit, line_shoulder, line_neck];
        richtung_linie = -1;
        richtung_rotierend = 1;
        ct.line_rotated_to = lines_height[0];
        break;
      case "height2":
        lines_between = [line_side, line_tai];
        richtung_linie = 1;
        richtung_rotierend = -1;
        ct.line_rotated_to = lines_height[1];
        break;
      case "neckline":
        lines_between = [line_armpit, line_shoulder];
        richtung_linie = 1;
        richtung_rotierend = 1;
        ct.line_rotated_to = line_neck;
        break;
      default:

    }

    //console.log(debug.sketch_has_line(line_side))
    const t1 = bust_dart(mea.bust_point, ct.abnaeher, line_bust, line_side, ct.degree, ct.line_rotated_to, richtung_linie);
    //remove_line(t1.cutted_left[0]);
    if(ct.degree != 0){

      t4 = rotate_dart(t1, lines_height[1], lines_between, richtung_linie, richtung_rotierend);
    }
  }*/
//  const t2 = tai_sho_dart(bust_point, t1.dart_tip, line_tai, -85);
  //const t3 = tai_sho_dart(bust_point, t1.dart_tip, line_shoulder, 75);
  remove_point(mea.bust_point);


  const bottom = lengthen(mea, ps_bottom, 1, ct);
  //console.log("front", line_armpit.get_length());
  if(ct.abnaeher > 0 && ct.degree != 0){
    mea.vorn_armk_hoehe = armk_hoehe(line_armpit.p1, t4.line_bust[0], -1);
    mea.front_shoulder = t4.line_cutted[0].get_length() + t4.line_cutted[1].get_length();

    mea.front_side = bottom.line_side_outer.get_length() + t4.line_side.get_length();
  } else {
    mea.vorn_armk_hoehe = armk_hoehe(line_armpit.p1, line_bust, -1);
    mea.front_shoulder = line_shoulder.get_length();

    mea.front_side = bottom.line_side_outer.get_length() + line_side[0].get_length() + line_side[1].get_length();
  //  mea.front_side = bottom.line_side_outer.get_length() + line_side.get_length();
  }

  // l_help erstellt oben bei line_tai, da nicht sicher gestellt ist, das line_tai nicht zerschnitten wird


}
// noch einmal überarbeiten
function lengthen(mea, ps, n, ct){
  const ln = line_between_points(ps[0], ps[1]);
  let l;
  if (ct){
    l = get_orth_line_length(ln, ps[0], n, mea.tai_height + (ct.abnaeher/2.5));
  } else {
    l = get_orth_line_length(ln, ps[0], n, mea.tai_height);
  }
  const line_bot = get_orth_line_length(l, l.p2, -n, ((mea.po + ct.freedom)/4));
  const line_side = side(ln.get_endpoints()[1], line_bot.get_endpoints()[1], l);

  remove_line(ln);
  return{
    line_side_inner: l,
    line_side_outer: line_side,
    line_bottom: line_bot
  }
}

function armk_hoehe(pt, ln, r){
  const vec = lotpunkt(ln, pt, r);
  const p = add_point(new Point(vec.x, vec.y));
  const l = line_between_points(pt, p);
  const len = l.get_length();
  remove_point(p);

  return len;
}


function genereate_bust_point(mea, ln1, ln2, ln_help, r){
  const l_h = line_with_length(ln2.p1, mea.bust_point_distance/2, 90*r);
  const lot_vec = lotpunkt(ln_help, l_h.p2, -r);
  const lot_p = add_point(new Point(lot_vec.x, lot_vec.y));
  const l = line_between_points(l_h.p2, lot_p);
  const inter = intersection_points(ln2, l);
  const vec = l.get_line_vector().normalize().scale(mea.bust_point_height).add(inter[0]);
  const p = add_point(new Point(vec.x, vec.y));
  remove_point(lot_p);
  remove_point(l_h.p2);

  return p;
}
//save(`out.svg`, 500, 500);

function adjust_back_shoulder(returns, mea, ct){
  difference = mea.back_shoulder - mea.front_shoulder;
  let length_first_part;
  let shoulder;
  if (returns.shoulder[0]){
    length_first_part = returns.shoulder[0].get_length();
    shoulder = returns.shoulder[0];
  } else {
    length_first_part = returns.shoulder.get_length();
    shoulder = returns.shoulder;
  }
  console.log(length_first_part, "length_first_part")
  //length_first_part =
  if (difference > 0.5){
    if (difference > length_first_part){
      //maeh -.-
    } else {
      percentage = difference / length_first_part;
      new_shoulder = point_at(shoulder, percentage);
      remove_point(new_shoulder.l1_segment.p1);
      //round_neckline(ct, "back", returns.heights, new_shoulder[1], -1);
      start_ln = returns.heights;
      ln = new_shoulder.l2_segment;

      const n_ln = get_orth_line(start_ln, start_ln.get_endpoints()[0], 1);
      const n_ln2 = get_orth_line_length(ln, ln.p1, length_first_part, -1);

      const intersect = intersect_lines(n_ln, n_ln2);
      remove_point(intersect.l1_segments[1].get_endpoints()[1]);
      remove_point(intersect.l2_segments[1].get_endpoints()[1]);

      const inter = interpolate_lines(intersect.l1_segments[0], intersect.l2_segments[0], 2);
      remove_point(intersect.intersection_points[0]);

    }
  }
  if (returns.shoulder[0]){
    mea.back_shoulder = new_shoulder.l2_segment.get_length() + returns.shoulder[1].get_length();
  } else {
    mea.back_shoulder = new_shoulder.l2_segment.get_length();
  }
}

export {front, back, adjust_back_shoulder};