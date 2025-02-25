import { DOWN, PlainLine, Ray, vec_angle } from '../../Core/StoffLib/geometry.js';
import lengthen from '../_depricated/lengthen/top.js';
import ShirtBase from "./base.js";
import ShirtSideHalfBase from "./side_half_base.js";

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

        if (this.dartside() === "waistline"){
            this.waistline_construction();
        } else {
            this.non_wasteline_construction();
        }
      
        this.mark_symmetry_line();
        this.compute_grainline();
    };

    waistline_construction(){
        this.shift_dart_to_waistline();
        lengthen.lengthen_top_with_dart(this.get_sketch(), this.mea, this.design_config.length);
    }

    non_wasteline_construction(){
        this.shift_dart_basic();
        this.fill_in_darts();
        lengthen.lengthen_top_without_dart_new(this.get_sketch(), this.mea, this.design_config.length);
    }

    compute_dart_position(){
        const dart_position_map = {
            "waistline": {
                dart_at_line: "waistline",
                fraction: null
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

    shift_dart_basic(dartside = null, position = null){
      // Shift anywhere except baseline
      dartside = dartside || this.dartside();
      position = position || this.dartposition();

      let line = this.get_line(dartside);
      const [inner, outer] = this.dart_lines();

      const fraction = Math.max(Math.min(position, 0.95), 0.05);
      const { point } = this.sketch.split_line_at_fraction(line, fraction);

      const old_dart_lines = this.dart_lines();
      this.sketch.cut([inner.common_endpoint(outer), point], true);
      
      const dart_lines = this.get_untyped_lines().set_data({
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

      this.sketch.remove(res.merged_lines[0]);
      line.data.type = "waistline";

      return dart_lines;
    }

    shift_dart_to_waistline(){
        const glue_dart_lines = this.shift_dart_basic("side", 0.5);
        const pivot = glue_dart_lines[0].common_endpoint(glue_dart_lines[1]);

        const dart_angle = Math.abs(vec_angle(
            glue_dart_lines[0].other_endpoint(pivot),
            glue_dart_lines[1].other_endpoint(pivot),
            pivot
        ));

        const waistline = this.get_line("waistline");
        const down_ray = new Ray(
            pivot,
            DOWN
        );
        const inner_dart_ray = down_ray.rotate(-dart_angle/2);
        
        const intersection = this.sketch.point(
            inner_dart_ray.intersect(waistline.get_endpoints())
        );
        this.sketch.point_on_line(intersection, waistline);
  
        this.sketch.cut([intersection, pivot], pivot);
        this.sketch.glue(...glue_dart_lines, {
            points: "delete"
        });

        const dart_lines = this.get_untyped_lines().set_data({
            type: "dart",
            dartposition: "waistline"
        });

        const dart_endpoints = dart_lines.map(l => l.other_endpoint(pivot));
        const cut_line = new PlainLine(
            dart_endpoints[0].other_adjacent_line(dart_lines[0]).other_endpoint(dart_endpoints[0]),
            dart_endpoints[1].other_adjacent_line(dart_lines[1]).other_endpoint(dart_endpoints[1])
        );

        const new_positions = dart_lines.map(l => cut_line.intersect(l.get_endpoints()));
        dart_endpoints[0].move_to(new_positions[0]);
        dart_endpoints[1].move_to(new_positions[1]);

        return dart_lines;
    }

    mark_symmetry_line(){
        const l = this.get_line("fold");
        l.data.symmetry_line = true;
        return l;
    }

    // Irgendwie das noch anders benennen? Oder: Docs..
    dartype(){
      return this.design_config.dartAllocation.position;
    }

    dartside(){
      return this.design_config.dartAllocation.dart_at_line;
    }

    dartposition(){
      return this.design_config.dartAllocation.fraction;
    }
}
