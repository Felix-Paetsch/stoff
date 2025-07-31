import SequentialStage from "../../../Core/Stages/base_stages/sequentialStage.js";
import {
    Vector,
    rotation_fun,
    vec_angle_clockwise,
    vec_angle,
    deg_to_rad,
    triangle_data,
    LEFT,
    DOWN
} from "../../../Core/StoffLib/geometry.js";
import ConnectedComponent from "../../../Core/StoffLib/connected_component.js";
import { spline } from "../../../Core/StoffLib/curves.js";


export default class CapeStage extends SequentialStage{
  constructor(){
      super();
  }

  on_enter(){
      super.on_enter();
      this.sketch = this.wd.sketch;
   //   this.call_substage_method("two_waistline_darts");

      //      Dangerous: this.call_stage_method("two_waistline_darts");
      // Also Dangerous: this.stages[0].two_waistline_darts(); (Unexpected results if stage not currently entered)
  }

  finish() {
    return this.wd;
  }


  construct_cape(){
    if(this.wd.side == "front"){
      this.#cut_short(-0.45);
      this.#remove_front_gapping(0.06);
      this.#open_armpit();
      this.wd.front_neckline_length = this.sketch.get_typed_line("neckline").get_length();
    } else {
      this.#cut_short(0.1);
      this.#remove_front_gapping(0.04);
      this.#open_armpit();
      this.wd.back_neckline_length = this.sketch.get_typed_line("neckline").get_length();
    }
  }

  #lot_position(pt, ln){

    const vec = ln.get_line_vector().get_orthonormal().scale(ln.get_length() * 4);
    const p1 = this.sketch.add_point(pt.add(vec));
    const p2 = this.sketch.add_point(pt.subtract(vec));
    const h_ln = this.sketch.line_between_points(p1, p2);
    let position = this.sketch.intersection_positions(ln, h_ln);
    //this.sketch.dev.at_url("/bla")
    this.sketch.remove(p1, p2);
    return position[0];
  }


  #cut_short(scale){
    // für Typ 2

    const pt_side = this.sketch.split_line_at_fraction(this.sketch.get_typed_line("side"), 0.5).point;
    pt_side.data.type = "f";

    const fold = this.sketch.get_typed_line("fold");
    const pt_fold = this.sketch.add_point(this.#lot_position(pt_side, fold));
    pt_fold.data.type = "b";
    const vec = pt_fold.subtract(fold.p1).scale(scale);
    pt_fold.move_to(pt_fold.add(vec));
    this.sketch.point_on_line(pt_fold, fold);


    const bottom = this.sketch.line_between_points(pt_fold, pt_side);
    bottom.data.type = "bottom";

    const waistline = this.sketch.get_typed_line("waistline");
    const o = this.sketch.get_typed_point("o");
    const bottom_old = this.sketch.get_typed_line("bottom");
    this.sketch.remove(o, waistline.p1, waistline.p2, bottom_old.p1, bottom_old.p2)


  }

  #remove_front_gapping(percent = 0.06){
    const armpit = this.sketch.get_typed_line("armpit");
    const bottom = this.sketch.get_typed_line("bottom");
    const pt = this.sketch.split_line_at_fraction(armpit, 0.65).point;
    const lot_pt = this.sketch.add_point(this.#lot_position(pt, bottom));
    this.sketch.point_on_line(lot_pt, bottom);
    this.remove_gapping(pt, lot_pt, percent, this.sketch.get_typed_line("side"));
  }

  #open_armpit(scale = 0.2){
    const side = this.sketch.get_typed_line("side");
    side.p1.move_to(side.get_line_vector().scale(scale).add(side.p1));

    this.draw_new_armpit(110, 0.8);
  }


// this function should be found in a libary
  remove_gapping(pt_fix, pt, percent, rotation_item){
    const lns_fix = pt_fix.get_adjacent_lines();
    const lns_pt = pt.get_adjacent_lines();

    const lns = pt.get_adjacent_lines();
    const p1 = lns[0].other_endpoint(pt);
    const p2 = lns[1].other_endpoint(pt);
    const vec = p2.subtract(p1).scale(percent / 2);

    const line = this.sketch.line_between_points(pt_fix, pt);

    const angle = vec_angle_clockwise(pt.add(vec).subtract(pt_fix), pt.subtract(vec).subtract(pt_fix));
    const fun = rotation_fun(pt_fix, angle);

    const cutted = this.sketch.cut(line);

    const comp = new ConnectedComponent(rotation_item);
    comp.get_points().forEach((pt, i) => {
      pt.move_to(fun(pt));
    });

    this.sketch.merge_points(cutted.cut_parts[0].line.p1, cutted.cut_parts[1].line.p1);
    cutted.cut_parts[0].line.p2.move_to(cutted.cut_parts[1].line.p2);
    this.sketch.merge_points(cutted.cut_parts[0].line.p2, cutted.cut_parts[1].line.p2);

    this.sketch.merge_lines(lns_fix[0], lns_fix[1], true);
    this.sketch.merge_lines(lns_pt[0], lns_pt[1], true);



  }

  // this function should be found in a libary
  draw_new_armpit(tiefe_percent, entlang){

    this.sketch.remove(this.sketch.get_typed_line("armpit"));

    let c = this.sketch.get_typed_point("c");
    let e = this.sketch.get_typed_point("e");

    const tiefe = this.wd.sh.bust / tiefe_percent;

    let l = this.sketch.line_from_function_graph(
        c,
        e,
        spline.bezier([
          new Vector(0,0), new Vector(tiefe, entlang), new Vector(0,1)
        ])//.plot_control_points(this.sketch),
    );

    l.data.type = "armpit";
    return l;
  }


  construct_cape_sleeve(){
    this.#cut_sleeve();
    const pts = this.sketch.get_typed_line("bottom_cut").get_endpoints();
    this.cut_sleeve_stripes(this.sketch.get_typed_line("bottom_cut"), 10);
    this.flare_bottom_sleeve(3);
    this.connect_sleeve_bottom(pts[1], pts[0]);

    this.#construct_special_bottom_part();

    this.construct_hood();
  }


  #cut_sleeve(){
    const sides = this.sketch.get_typed_lines("side");

    const side1 = this.sketch.split_line_at_fraction(sides[0], 0.65);
    const side2 = this.sketch.split_line_at_fraction(sides[1], 0.65);
    const cut_line = this.sketch.line_between_points(side1.point, side2.point);

    const cutted = this.sketch.cut(cut_line);

    const comp_upper_part = new ConnectedComponent(this.sketch.get_typed_line("armpit"));
    const comp_lower_part = new ConnectedComponent(this.sketch.get_typed_line("bottom"));

    comp_upper_part.get_untyped_lines()[0].data.type = "bottom_cut";
    comp_lower_part.get_untyped_lines()[0].data.type = "top_cut";

    comp_lower_part.get_points().forEach((pt, i) => {
      pt.move_to(pt.add(new Vector(0, 5)));
    });

  }

  #construct_special_bottom_part(){
    const bottom = this.sketch.get_typed_line("bottom");
    const comp = new ConnectedComponent(bottom);
    let vec =  new Vector(bottom.p2.add(new Vector(-2, 5)));
    const comp2 = comp.paste_to_sketch(this.sketch, vec);

// small part
    const bottom_2 = comp2.get_lines().filter(ln => ln.data.type == "bottom")[0];
    vec = bottom_2.p1.other_adjacent_line(bottom_2).get_line_vector().scale(0.75);
    bottom_2.p1.move_to(bottom_2.p1.subtract(vec));
    vec = bottom_2.p2.other_adjacent_line(bottom_2).get_line_vector().scale(0.75);
    bottom_2.p2.move_to(bottom_2.p2.subtract(vec));

// overlapping Part
// verdoppeln in der Länge
    vec = bottom.p1.other_adjacent_line(bottom).get_line_vector();
    bottom.p1.move_to(bottom.p1.add(vec));
    vec = bottom.p2.other_adjacent_line(bottom).get_line_vector();
    bottom.p2.move_to(bottom.p2.add(vec));

    // aufteilen - zweiteilig in der Zusammensetzung aufgrund der Ösen
    const comp3 = comp.paste_to_sketch(this.sketch, bottom.p1.add(new Vector(0, -45)));
    let scale = 0.2
// die Lange aussenseite, (ist verdoppelt in der Höhe zum umklappen, daher so lang)
    const side = bottom.p1.other_adjacent_line(bottom);
    vec = side.p1.other_adjacent_line(side).get_line_vector().scale(scale);
    side.p1.move_to(side.p1.add(vec));
    vec = side.p2.other_adjacent_line(side).get_line_vector().scale(scale);
    side.p2.move_to(side.p2.add(vec));

// die innenseite bei der gezogen wird
    // scale in der mitte fehlt ursprünglich + überlappung *4
    scale = scale + 0.1 * 4;
    const sides_3 = comp3.get_lines().filter(ln => ln.data.type == "side");
    vec = sides_3[1].p1.other_adjacent_line(sides_3[1]).get_line_vector().scale(scale);
    sides_3[0].p1.move_to(sides_3[1].p1.subtract(vec));
    vec = sides_3[1].p2.other_adjacent_line(sides_3[1]).get_line_vector().scale(scale);
    sides_3[0].p2.move_to(sides_3[1].p2.subtract(vec));


  }

// should be in a libary!!!

  // Für schönere Kurven bitte Zahlen über 10 nehmen!
  // Nimmt als Linie oben Armpit
  cut_sleeve_stripes(bottom_line, number_of_stripes = 3) {
      let lns = [];
      let bottom = bottom_line;
      let armpit = this.sketch.get_typed_line("armpit");

      const len = bottom.get_length() / number_of_stripes;
      const vec = this.sketch
          .get_typed_line("side")
          .get_line_vector()
          .scale(-2)
          .add(new Vector(0, -this.wd.measurements.distance_armpit * 2));

      let temp = this.sketch.split_line_at_length(bottom, len);
      for (let i = 0; i < number_of_stripes - 1; i++) {
          lns.push(
              this.sketch.line_at_angle(
                  temp.point,
                  deg_to_rad(0),
                  vec.length(),
              ).line,
          );
          lns[i].data.type = "dart";
          lns[i].data.dart_number = i + 1;
          lns[i].swap_orientation();
          const intersection = this.sketch.intersect_lines(lns[i], armpit);
          armpit = intersection.l2_segments[0];
          this.sketch.remove(intersection.l1_segments[0].p1);

          armpit = intersection.l2_segments[0];
          if (i < number_of_stripes - 2) {
              temp = this.sketch.split_line_at_length(
                  temp.line_segments[1],
                  len,
              );
          }
      }
  }

  flare_bottom_sleeve(distance_armpit = 5, flare_by_angle = false) {
      const dart_lines = this.sketch.get_typed_lines("dart");
      if (dart_lines.length == 0) return;

      dart_lines.sort(function (a, b) {
          return a.data.dart_number - b.data.dart_number;
      });

      const angles = [];
      if (flare_by_angle) {
          const index = Math.round(dart_lines.length / 2);
          const len = dart_lines[index].get_length();
          dart_lines.forEach((l) => {
              const angle = triangle_data({
                  a: len,
                  b: len,
                  c: distance_armpit,
              }).gamma;
              angles.push(angle);
          });
      } else {
          dart_lines.forEach((l) => {
              const len = l.get_length();
              const angle = triangle_data({
                  a: len,
                  b: len,
                  c: distance_armpit,
              }).gamma;
              angles.push(angle);
          });
      }

      let top_right_corner = this.sketch.get_typed_point("d");
      let prev_top_right_corner = dart_lines[0].p1; // Will become relevant only for n>1 th line
      let prev_bottom_left_corner = dart_lines[0].p1;

      dart_lines.forEach((l, index) => {
          const top_left_corner = l.p1;

          //l.p1.set_color("red");
          //l.p1.attributes.radius = 5;
          const bottom_right_corner = top_right_corner.other_adjacent_point(
              top_left_corner,
              prev_top_right_corner,
              prev_bottom_left_corner,
          );
          //this.sketch.dev.at_new_url("/wah")
          const cut_res = this.sketch.cut(l, l.p1);
          const bottom_left_corner = cut_res.points.get_point_between_lines(
              (l) => l.has_endpoint(bottom_right_corner),
              (l) => l.has_endpoint(top_left_corner),
          );

          // The new entry in dart_lines[i] is the right side of the split dart
          dart_lines[index] = top_left_corner
              .common_line(bottom_left_corner)
              .set_orientation(top_left_corner, bottom_left_corner);
          for (let i = index; i < dart_lines.length; i++) {
              const pivot = dart_lines[i].p1;
              const angle = angles[i];
              const rot_fun = rotation_fun(pivot, -angle);

              [
                  bottom_left_corner,
                  bottom_right_corner,
                  top_right_corner,
              ].forEach((p) => p.move_to(rot_fun(p)));
          }

          prev_top_right_corner = top_right_corner;
          top_right_corner = top_left_corner;
          prev_bottom_left_corner = bottom_left_corner;
      });

      let correction_angle;
      let correction_pivot;
      if (dart_lines.length % 2 == 0) {
          const lhs_line = dart_lines[Math.round(dart_lines.length / 2)];
          const left_center = lhs_line.p2;
          const right_center = left_center.other_adjacent_point(lhs_line.p1);

          const dir_vec = left_center.subtract(right_center);

          correction_pivot = right_center;
          correction_angle = vec_angle(dir_vec, LEFT);
      } else if (dart_lines.length % 2 == 1) {
          const rhs_line = dart_lines[Math.floor(dart_lines.length / 2)];
          correction_pivot = rhs_line.p1;
          correction_angle = vec_angle(rhs_line.get_line_vector(), DOWN) / 2;
      }

      const rot_correction_fun = rotation_fun(
          correction_pivot,
          correction_angle,
      );
      this.sketch.transform((p) => p.move_to(rot_correction_fun(p)));
  }

  connect_sleeve_bottom(start_pt, end_pt, middle_addition = 3) {
      let lns = this.sketch.get_typed_lines("dart");
      //  let lns = this.sketch.get_typed_lines("bottom");
      lns.sort(function (a, b) {
          return a.p2.x - b.p2.x;
      });
      let sides = this.sketch.get_typed_lines("side");
      const vec = sides[0].p1
          .subtract(sides[1].p1)
          .scale(0.5)
          .add(sides[1].p1);
      let pts = [start_pt];
      const step_size =
          middle_addition / Math.log(Math.round((lns.length - 1) / 2));

      let lns_1 = lns.slice(0, Math.round(lns.length / 2));
      let lns_2 = lns.slice(Math.round(lns.length / 2)).reverse();
      for (let i = 0; i < lns_1.length; i += 2) {
          const ln1 = lns_1[i];

          const addition = step_size * Math.log(i + 2);

          //const p = ln1.p1.subtract(ln1.p2).scale(0.5).add(ln1.p2);
          let vec_h = ln1.get_line_vector().normalize().scale(addition);
          pts.push(this.sketch.add_point(ln1.p2.add(vec_h)));
      }
      let pts_h = [end_pt];
      for (let i = 0; i < lns_2.length; i += 2) {
          const ln1 = lns_2[i];

          const addition = step_size * Math.log(i + 2);

          //const p = ln1.p1.subtract(ln1.p2).scale(0.5).add(ln1.p2);
          let vec_h = ln1.get_line_vector().normalize().scale(addition);
          pts_h.push(this.sketch.add_point(ln1.p2.add(vec_h)));
      }

      pts = pts.concat(pts_h.reverse());
      /*
       */
      this.sketch.remove(lns[0].p2, lns[lns.length - 1].p2);
      delete lns[0];
      delete lns[lns.length - 1];
      lns.forEach((ln) => {
          this.sketch.remove(ln.p2);
      });
      /*
      lns = [];
      for (let i = 0; i < pts.length - 1; i++) {
          const p1 = pts[i];
          const p2 = pts[i + 1];
          lns.push(this.sketch.line_between_points(p1, p2));
      }
*/

      //const curve = this.#curve_lines(lns);
      const curve = this.sketch.line_from_function_graph(
          pts[0],
          pts[pts.length - 1],
          spline.catmull_rom_spline(pts),
      );
      /*
       */
      delete pts[0];
      delete pts[pts.length - 1];
      pts.forEach((p) => {
          this.sketch.remove(p);
      });
      this.#merge_parts("armpit");
  }

  #merge_parts(type) {
      let lns = this.sketch.get_typed_lines(type);
      lns = this.sketch.order_by_endpoints(lns);
      let temp = lns[0];
      for (let i = 1; i < lns.length; i++) {
          const ln = lns[i];

          temp = this.sketch.merge_lines(temp, ln, true);
      }
  }


  construct_hood(){
    const len_front = this.wd.front_neckline_length;
    const len_back = this.wd.back_neckline_length;

  }
}
