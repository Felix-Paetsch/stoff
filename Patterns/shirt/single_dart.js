import utils from '../funs/utils.js';
import top from '../top/simple_top.js';
import lengthen from '../lengthen/top.js';
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
        this.set_grainline_basic();
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
            top.waistline_simple_dart(this.get_sketch(), this.dartposition());
        } else {
            top.simple_middle_dart(this.get_sketch(), this.dartside(), this.dartposition());
        }

        if (this.design_config.dartAllocation.position == "french"){
            let dart = this.get_sketch().lines_by_key("type").dart.filter(elem => elem.data.dartposition === "side");
            utils.switch_inner_outer_dart(dart);
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
    waist_inner = waist_inner.filter(ln => ln.data.side === "inner")[0];

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
