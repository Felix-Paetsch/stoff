import utils from '../funs/utils.js';
import top from '../top/simple_top.js';
import lengthen from '../lengthen/top.js';
import { vec_angle_clockwise } from "../../StoffLib/geometry.js"
import ShirtBase from "./base.js";
import DartAllocationSideBase from "./dartAllocation_side_base.js";


export default class SingleDartShirt extends ShirtBase{
    constructor(measurements, design_config){
        super(measurements, design_config);
        this.build_from_side_component(SingleDartSide);
    }
}

class SingleDartSide extends DartAllocationSideBase{
    constructor(side = "front", parent){
        super(side, parent);
        this.dart = true;

        this.compute_dart_position();
        this.shift_dart();
        this.compute_grainline();
        this.lengthen();
    };


    compute_dart_position(){
        // @TODO: Maybe want to already here have a dart be a class?

        const dart_position_map = {
            "waistline": {
                dart_at_line: "waistline",
                fraction: this.#calculate_upright_position(this.get_sketch())
            },
            "french": {
                dart_at_line: "side",
                fraction: 0.9
            },
            "side middle": {
                dart_at_line: "side",
                fraction: 0.3
            },
            "shoulder": {
                dart_at_line: "shoulder",
                fraction: 0.5
            },
        }

        if (!dart_position_map[this.design_config.dartAllocation.position]){
            throw new Error("Bad dart position selected!");
        }

        Object.assign(
            this.design_config.dartAllocation,
            dart_position_map[this.design_config.dartAllocation.position]
        );
    };

    // @TODO: Below
    shift_dart(){
        if(this.dartside() === "waistline"){
            this.simple_waistline_dart();
        } else {
            this.simple_middle_dart();
        }

        if (this.design_config.dartAllocation.position == "french"){
            let dart = this.get_sketch().lines_by_key("type").dart.filter(elem => elem.data.dartposition === "side");
            utils.switch_inner_outer_dart(dart);
        }
    }

    simple_waistline_dart(){
        this.simple_middle_dart("side", 0.5);
        this.simple_middle_dart("waistline");

        const darts = this.get_lines("dart");
        const {
            outer, inner
        } = this.ordered_lines(...darts);

        let side = this.get_line("side");
        let fold = this.get_line("fold");
        let ln = this.sketch.line_between_points(fold.p2, side.p2);

        let vec = inner.get_line_vector().add(inner.p2);
        inner.p2.move_to(vec.x, vec.y);
        let pt = this.sketch.intersection_positions(ln, inner);
        inner.p2.move_to(pt[0]);

        let len = inner.get_length();
        vec = outer.get_line_vector().normalize().scale(len).add(outer.p1);
        outer.p2.move_to(vec.x, vec.y);

        this.sketch.remove_line(ln);
    }

    simple_middle_dart(dartside = null, position = null){
        dartside = dartside || this.dartside();
        position = position || this.dartposition();

        let line = this.get_line(dartside);

        const darts = this.get_lines("dart");
        const {
            inner, outer
        } = this.ordered_lines(...darts);

        // Split
        const fraction = Math.max(Math.min(position, 0.95), 0.05);
        const {
          point, line_segments
        } = this.sketch.split_line_at_fraction(line, fraction);
        let pt2 = this.sketch.add_point(point.copy());
        line_segments[0].set_endpoints(line_segments[0].p1, pt2);

        let p2 = this.sketch.add_point(inner.p1.copy());
        inner.set_endpoints(p2, inner.p2);

        let dart1 = utils.close_component(this.sketch, inner.p1, [point, pt2]);
        let dart2 = utils.close_component(this.sketch, outer.p1, [point, pt2]);
        dart1.data.type = "dart";
        dart1.data.dartposition = line.data.type;
        dart2.data.type = "dart";
        dart2.data.dartposition = line.data.type;

        const other_dart_lines = this.get_lines("dart").filter(l => l.data.type !== dartside);
        const {
          outer: other_outer,
          inner: other_inner
        } = this.ordered_lines(...other_dart_lines);
        
        const angle = vec_angle_clockwise(other_outer.p2, other_inner.p2, other_inner.p1);
        utils.rotate_zhk(this.sketch, -angle, other_outer.p1);

        this.sketch.merge_points(inner.p1, outer.p1);
      
        let fold = this.get_line("fold");
        if (this.darttype() !== "waistline"){
          let line;
          if (this.dartside() === "side"){
            line = this.sketch.line_between_points(fold.p2, line_segments[1].p2);
          } else {
            const side = this.get_line("side");
            line = this.sketch.line_between_points(fold.p2, side.p2);
          }
          
          line.data.type = "waistline";
          this.sketch.remove_points(other_inner.p2, other_outer.p2);
        } else {
          let temp = this.sketch.merge_points(other_inner.p2, other_outer.p2);
          this.sketch.remove_lines(other_inner, other_outer);
          temp = temp.get_adjacent_lines();
          this.sketch.merge_lines(temp[0], temp[1], true);
      }
      console.log(this.sketch.lines_by_key("type").shoulder.length);
  }


  // berechnet wo das Bein des Abnähers liegen muss, damit dieser genau Senkrecht
  // zur Taille verläuft
  // WARNING: Ich habe noch nicht versucht das effizienter zu machen und diese Funktion überarbeitet
  #calculate_upright_position(s){
    // finden, bei wie viel % der Abnäher liegen muss, damit er genau Senkrecht liegt
    let lines = s.lines_by_key("type").dart;

    lines = utils.sort_dart_lines(lines); // [0] ist am weitesten außen
    let dist = lines[0].p2.subtract(lines[1].p2).length();

    if(s.data.dartposition !== "waistline"){
      dist = dist/2;
    }

    let waist_inner = s.lines_by_key("type").waistline;
    let waist_width = waist_inner[0].get_length() + waist_inner[1].get_length();
    waist_inner = waist_inner.filter(ln => ln.data.dartside === "inner")[0];

    let val = waist_inner.get_length() - (dist);
    let percent = val/waist_width;

    return percent;
  }

  darttype(){
    return this.design_config.dartAllocation.position;
  }

// irgendwie das noch anders benennen?
  dartside(){
    return this.design_config.dartAllocation.dart_at_line;
  }

  dartposition(){
    return this.design_config.dartAllocation.fraction;
  }

  get_mirror_line(){
    let lines = this.get_sketch().lines_by_key("type").fold;
    if (lines.length > 1){
      // es wird automatisch der Teil von Fold gewählt, welcher am längsten ist
      lines = lines.sort(function(a, b){return b.get_length() - a.get_length()});
    }
    return lines[0];
  }


  lengthen(){
    if (this.dartside() === "waistline"){
      lengthen.lengthen_top_with_dart(this.get_sketch(), this.mea, this.design_config.length);
    } else {
      lengthen.lengthen_top_without_dart_new(this.get_sketch(), this.mea, this.design_config.length);
    }
  }


// Wenn man die Falte an der gespiegelt werden soll zerscheidet, kann es sein, dass
// gar nicht oder falsch gespiegelt wird.
// Das ganze System muss also überarbeitet werden
  mirror(){
    let lines = this.get_sketch().lines_by_key("type");
    let fold = lines.fold[0];
    let fold_bottom = lines.fold_bottom;

    if(fold_bottom){
      let line = this.get_sketch().merge_lines(fold_bottom[0], fold, true);
    }


    this.sketch = utils.mirror_on_fold(this.get_sketch());
  };


  seam_allowance(s){
//    this.get_sketch().lines_by_key("type").side[0].swap_orientation();
    super.seam_allowance(s);
  }

}
