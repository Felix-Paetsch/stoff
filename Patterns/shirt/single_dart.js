import utils from '../funs/utils.js';
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

        this.handle_darts();

        
        this.seam_allowance();
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
    }

    pseudo_common(l1, l2){
      if (l1.p1.distance(l2.p1) < 0.00001) return l1.p1;
      if (l1.p1.distance(l2.p2) < 0.00001) return l1.p1;
      if (l1.p2.distance(l2.p1) < 0.00001) return l1.p2;
      if (l1.p2.distance(l2.p2) < 0.00001) return l1.p2;
      return null;
    }

    pseudo_other(l, pt){
      if (l.p1.distance(pt) < 0.00001) return l.p2;
      return l.p1;
    }

    fix_dart_orientation(l1, l2){
      if (l1.p1.distance(l2.p1) < 0.0001) return 1;
      return -1;
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

        const common = this.pseudo_common(inner, outer);
        let pt1 = this.sketch.intersection_positions(ln, inner);
        this.pseudo_other(inner, common).move_to(pt1[0]);

        let pt2 = this.sketch.intersection_positions(ln, outer);
        this.pseudo_other(outer, common).move_to(pt2[0]);

        this.sketch.remove_line(ln);
    }

    simple_middle_dart(dartside = null, position = null){
        dartside = dartside || this.dartside();
        position = position || this.dartposition();

        let line = this.get_line(dartside);

        const darts = this.get_lines("dart");
        //if (darts.length % 2 ==);
        const {
            inner, outer
        } = this.ordered_lines(...darts);

        // Split
        const fraction = Math.max(Math.min(position, 0.95), 0.05);
        const {
          point
        } = this.sketch.split_line_at_fraction(line, fraction);

        const { cut_parts } = this.sketch.cut([point, inner.common_endpoint(outer)]);

        cut_parts[0].line.attributes.strokeWidth = 5;
        cut_parts[0].line.data.type = "dart";
        cut_parts[0].line.data.dartposition = line.data.type;
        cut_parts[1].line.data.type = "dart";
        cut_parts[1].line.data.dartposition = line.data.type;

        const other_dart_lines = this.get_lines("dart").filter(l => l.data.type !== line.data.type);  
        const res = this.sketch.glue(other_dart_lines[0], other_dart_lines[1]);
        console.log(res);

        if (this.darttype() !== "waistline"){
            let line;
            line = this.sketch.line_between_points(
                this.point_between_lines("fold", "waistline"), 
                this.point_between_lines("side", "waistline")
            );
            line.data.type = "waistline";
            this.sketch.remove(res.points[1]);
        } else {
            if (rotate_around == other_inner.p2){
                let temp = this.sketch.merge_points(other_inner.p1, other_inner.p1);
                this.sketch.remove_lines(inner, outer);
                temp = temp.get_adjacent_line
                ();
                this.sketch.merge_lines(temp[0], temp[1], true);
                other_inner.swap_orientation();
                other_outer.swap_orientation();
            } else {
              let line;
              line = this.sketch.line_between_points(
                  this.point_between_lines("fold", "waistline"), 
                  this.point_between_lines("side", "waistline")
              );
              line.data.type = "waistline";
              this.sketch.remove_points(other_inner.p2, other_outer.p2);
            }
        }
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
