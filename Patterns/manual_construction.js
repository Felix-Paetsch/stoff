import SewingSketch from "../Core/PatternLib/sewing_sketch.js";
import { Sewing } from "@/Core/Sewing/sewing.js";
import { start_recording, stop_recording } from "@/Core/Debug/recording.js";
import { at_url, hot_at_url } from "@/Core/Debug/render_at.js";
import Renderer from "@/Core/Sewing/rendering/renderer/index.js";
import FaceAtlas from "@/Core/PatternLib/faces/faceAtlas.js";
import { RIGHT, UP, Vector, vec_angle_clockwise } from "@/Core/StoffLib/geometry";


export function construct_maual(sketches) {
  const s = new Sewing(sketches);


  close_darts(sketches, s);
  close_waistline_darts(sketches, s);


  return s;
}


function close_darts(sketches, s){
  sketches.forEach(sketch => {
    const lines_map = sketch.lines_by_key("sewing")
    if (Object.keys(lines_map).includes("close_dart")){
      const lines = lines_map.close_dart;

      const l_left = lines.filter((ln) => ln.right_handed)
      const l_right = lines.filter((ln) => !ln.right_handed)

      const darts = l_left.length /3;
      for (let i = 1; i <= darts; i++){
        let lns = l_left.filter((ln) => ln.data.dart_number == i);
        close_dart(s, lns);
        lns = l_right.filter((ln) => ln.data.dart_number == i);
        close_dart(s, lns);

      }
    }
  });
}

function close_dart(s, lines){
  if(lines.length > 0){

    let ln = lines.filter(ln => ln.data.type == "annotation");
    let lns = lines.filter(ln => ln.data.type == "dart");

    // at_url(ln.sketch, "/test", true);
    s.fold(ln[0]);
    const l1 = s.sewing_line(lns[0]);
    const l2 = s.sewing_line(lns[1]);
    s.sew(l1, [{
      line: l2,
      same_orientation: true,
      same_handedness: true
    }])
  }
}

function close_waistline_darts(sketches, s){
  sketches.forEach(sketch => {
    const lines_map = sketch.lines_by_key("sewing")
    if (Object.keys(lines_map).includes("close_waistline_dart")){
      const lines = lines_map.close_waistline_dart;

      const l_left = lines.filter((ln) => ln.right_handed)
      const l_right = lines.filter((ln) => !ln.right_handed)

      let lns = l_left.filter((ln) => ln.data.position == "inner");
      close_dart(s, lns);
      lns = l_right.filter((ln) => ln.data.position == "inner");
      close_dart(s, lns);

      lns = l_left.filter((ln) => ln.data.position == "outer");
      close_dart(s, lns);
      lns = l_right.filter((ln) => ln.data.position == "outer");
      close_dart(s, lns);
    }
  });
}
