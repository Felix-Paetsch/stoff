// @ TODO

import dart from '../../_depricated/darts/simple_dart.js';
import annotate from '../../_depricated/annotate/annotate.js';

export default function fill_in_darts(type = null, lines = null){
    if (!this.dart) return;
    if (type instanceof Array){
        lines = type;
        type = null;
    }
    
    lines = lines || this.dart_lines();
    while(lines.length > 0){
      _fill_in_dart.bind(this)(lines);
      if(type || this.dartstyle() === "tuck"){
        dart.simple_tuck(this.sketch, lines);
        annotate.annotate_tuck(this.sketch, lines);
      } else {
        dart.single_dart(this.sketch, lines);
        annotate.annotate_dart(this.sketch, lines);
      }
      lines.splice(0, 2);
    }
    annotate.remove_dart(this.sketch);
    _connect_filling.bind(this)(this.sketch);   
}

function _fill_in_dart(lines){
    if(lines[0].data.dartposition === "waistline"){
      let other_lines = this.get_lines("dart_bottom");
      if (other_lines){
        if (other_lines[0].p1 !== other_lines[1].p1){
          let ln1 = s.line_between_points(lines[0].p1, other_lines[0].p1);
          let ln2 = s.line_between_points(lines[0].p1, other_lines[1].p1);
          let data1 = other_lines[0].data;
          let data2 = other_lines[1].data;
          this.sketch.remove(other_lines[0], other_lines[1]);
          dart.fill_in_dart(s, [ln1, ln2]).data.type = "filling";

          s.line_between_points(ln1.p2, lines[1].p2).data = data1;
          s.line_between_points(ln2.p2, lines[0].p2).data = data2;
          s.remove(ln1, ln2);
        } else {
          return;
        }
      } else {
        dart.fill_in_dart(this.sketch, lines).data.type = "filling";
      }
    } else {
      const [inner, outer] = this.dart_lines();
      dart.fill_in_dart(this.sketch, inner, outer).data.type = "filling";
    }
}

function _connect_filling(s){
  let lines = s.lines_by_key("type").filling;
  if (lines){
    lines.forEach((line) => {
      let ln1 = line.p1.other_adjacent_line(line);
      let ln2 = line.p2.other_adjacent_line(line);

      if(line.get_endpoints().includes(ln1.p2)){
        ln1 = s.merge_lines(
          ln1, line, true,
          (data_ln1, data_line) => {
            return data_ln1;
          }
        );
          s.merge_lines(ln1, ln2, true, (data_ln1, data_l2) => {
              return data_ln1;
          });

      } else {
        ln2 = s.merge_lines(
          ln2, line, true,
          (data_ln1, data_line) => {
            return data_ln1;
          }
        );
          s.merge_lines(ln2, ln1, true, (data_ln1, data_l2) => {
              return data_ln1;
          });


      }

    });
  }
}