import lengthen from '../lengthen/top.js';
import ShirtBase from "./base.js";
import ShirtSideHalfBase from "./side_half_base.js";

// @remove
import utils from '../funs/utils.js';


export default class SingleDartShirt extends ShirtBase{
    constructor(measurements, design_config){
        super(measurements, design_config);
        this.build_from_side_half_component(SingleDartSideHalf);
    }
}

class SingleDartSideHalf extends ShirtSideHalfBase{
    constructor(side = "front", parent){
        super(side, parent);

        // Initialize
        this.dart = true;
        this.compute_dart_position();

        // Handle Darts
        this.shift_dart();
        this.fill_in_darts();

        // Independent Constructions
        this.lengthen();

      
        // this.seam_allowance();
        this.mark_symmetry_line();
        this.compute_grainline();

        this.clean_up1();

    };

    compute_dart_position(){
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

    shift_dart(){
        if(this.dartside() === "waistline"){
            this.shift_dart_to_waistline();
        } else {
            this.shift_dart_basic();
        }
    }

    shift_dart_basic(dartside = null, position = null){
      dartside = dartside || this.dartside();
      position = position || this.dartposition();

      let line = this.get_line(dartside);
      const [inner, outer] = this.dart_lines();

      const fraction = Math.max(Math.min(position, 0.95), 0.05);
      const { point } = this.sketch.split_line_at_fraction(line, fraction);

      const old_dart_lines = this.dart_lines();
      this.sketch.cut([inner.common_endpoint(outer), point], true);
      
      this.get_untyped_lines().set_data({
          type: "dart",
          dartposition: line.data.type
      });

      const res = this.sketch.glue(...old_dart_lines, {
          points: "delete"
      });

      line = this.sketch.line_between_points(
          this.point_between_lines("fold", "waistline"), 
          this.point_between_lines("side", "waistline")
      );

      if (dartside != "waistline"){
          this.sketch.remove(res.merged_lines[0]);
      }

      line.data.type = "waistline";
    }

    // @TODO: Below

    shift_dart_to_waistline(){
        this.shift_dart_basic("side", 0.5);
        this.shift_dart_basic("waistline");

        const [d1, d2] = this.get_lines("dart");

        let ln = this.line_between_points(
            this.point_between_lines("fold", "waistline"),
            this.point_between_lines("side", "waistline"),
        );

        let pt1 = this.sketch.intersection_positions(ln, d1);
        d1.other_endpoint(d2).move_to(pt1[0]);

        let pt2 = this.sketch.intersection_positions(ln, d2);
        d2.other_endpoint(d2).move_to(pt2[0]);

        this.sketch.remove_line(ln);
    }

    


  

  // Irgendwie das noch anders benennen?
  dartype(){
    return this.design_config.dartAllocation.position;
  }

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

  mark_symmetry_line(){
      const l = this.get_line("fold");
      l.data.symmetry_line = true;
      return l;
  }

// Wenn man die Falte an der gespiegelt werden soll zerscheidet, kann es sein, dass
// gar nicht oder falsch gespiegelt wird.
// Das ganze System muss also überarbeitet werden
  mirror(){
    this.sketch = utils.mirror_on_fold(this.get_sketch());
  };



  clean_up1(){
     // Todo: Remove
      let lines = this.get_sketch().lines_by_key("type");
      let fold = lines.fold[0];
      let fold_bottom = lines.fold_bottom;

      if (fold_bottom){
        let line = this.get_sketch().merge_lines(fold_bottom[0], fold, true);
      }
  }

  // berechnet wo das Bein des Abnähers liegen muss, damit dieser genau Senkrecht
  // zur Taille verläuft
  // WARNING: Ich habe noch nicht versucht das effizienter zu machen und diese Funktion überarbeitet
  #calculate_upright_position(s){
    console.log("TODO@here")
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
}
