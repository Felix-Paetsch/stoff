import SewingSketch from "../Core/PatternLib/sewing_sketch.js";
import { Sewing } from "@/Core/Sewing/sewing.js";
import { start_recording, stop_recording } from "@/Core/Debug/recording.js";
import { at_url, hot_at_url } from "@/Core/Debug/render_at.js";
import Renderer from "@/Core/Sewing/rendering/renderer/index.js";
import FaceAtlas from "@/Core/PatternLib/faces/faceAtlas.js";
import {
    RIGHT,
    UP,
    Vector,
    vec_angle_clockwise,
} from "@/Core/StoffLib/geometry";

export function construct_maual(sketches) {
    const s = new Sewing(sketches);

    const data = {
      side: "overlock",
      shoulder: "knappnaht",
      neckline: "",
      hem: "",
      back: "",
      darts: "",

    }

    close_darts(sketches, s);
    close_waistline_darts(sketches, s);

// noch keine Raglan aermel, sonst erst seite, dann ärmel, dann halsausschnitt
// wenn fancy knopfleiste o.ä. dann ggf. vor schulter
// wenn vortlaufender besatz (keine Besatzversäuberung), dann ärmel und halsausschnitt gleichzeitig

    // schulter, halsausschnitt, hinten, seite, armausschnitt, saum

    close_shoulder(sketches, s);

    sew_neckline(sketches, s);

    close_back(sketches, s);

    close_side(sketches, s);


    return s;
}

function close_darts(sketches, s) {
    hot_at_url(s, "/wha");

    sketches.forEach((sketch) => {
        const lines_map = sketch.lines_by_key("sewing");
        if (Object.keys(lines_map).includes("close_dart")) {
            const lines = lines_map.close_dart;

            const l_left = lines.filter((ln) => ln.right_handed);
            const l_right = lines.filter((ln) => !ln.right_handed);

            const darts = l_left.length / 3;
            for (let i = 1; i <= darts; i++) {
                let lns = l_left.filter((ln) => ln.data.dart_number == i);
                close_dart(s, lns);
                lns = l_right.filter((ln) => ln.data.dart_number == i);
                close_dart(s, lns);
            }
        }
    });
}

function close_dart(s, lines) {
    if (lines.length > 0) {
        let ln = lines.filter((ln) => ln.data.type == "annotation");
        let lns = lines.filter((ln) => ln.data.type == "dart");

        // at_url(ln.sketch, "/test", true);
        s.fold(ln[0]);
        const l1 = s.sewing_line(lns[0]);
        const l2 = s.sewing_line(lns[1]);
        s.sew(l1, [
            {
                line: l2,
                same_orientation: true,
                same_handedness: false,
            },
        ]);

        s.hightlight(...s.sewing_points)
    }
}

function close_waistline_darts(sketches, s) {
    sketches.forEach((sketch) => {
        const lines_map = sketch.lines_by_key("sewing");
        if (Object.keys(lines_map).includes("close_waistline_dart")) {
            const lines = lines_map.close_waistline_dart;

            const l_left = lines.filter((ln) => ln.right_handed);
            const l_right = lines.filter((ln) => !ln.right_handed);

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

function close_shoulder(sketches, s){
  let lns1 = [];
  let lns2 = [];
  sketches.forEach((sketch, i) => {
      const lines = sketch.get_typed_lines("shoulder");
      if (lines) {
        const l_left = lines.filter((ln) => ln.right_handed);
        const l_right = lines.filter((ln) => !ln.right_handed);
        s.hightlight(...l_left.map(l => s.sewing_line(l)));
        s.hightlight(...l_right.map(l => s.sewing_line(l)));
        if (i == 0){
            lns1.push(s.merge_lines(...l_left));
            lns2.push(s.merge_lines(...l_right));
        } else {
            lns2.push(s.merge_lines(...l_left));
            lns1.push(s.merge_lines(...l_right));
        }
      }
  });
  //s.sew(lns1[0], lns1[1]);
  //s.sew(lns2[0], lns2[1]);
}

function close_side(sketches, s){
  let lns1 = [];
  let lns2 = [];
  sketches.forEach((sketch, i) => {
      const lines = sketch.get_typed_lines("side");
      if (lines) {
        const l_left = lines.filter((ln) => ln.right_handed);
        const l_right = lines.filter((ln) => !ln.right_handed);
        if (i == 0){
          //  lns1.push(s.merge_lines(l_left));
          //    lns2.push(s.merge_lines(l_right));
        } else {
          //  lns2.push(s.merge_lines(l_left));
          //    lns1.push(s.merge_lines(l_right));
        }
      }
  });
  //s.sew(lns1[0], lns1[1]);
  //s.sew(lns2[0], lns2[1]);
}

// Wird aktuell nicht verwendet
function close_back(sketches, s){
  let lns1 = [];
  let lns2 = [];
  sketches.forEach((sketch, i) => {
      const lines = sketch.get_typed_lines("back_cut");
      if (lines) {
        const l_left = lines.filter((ln) => ln.right_handed);
        const l_right = lines.filter((ln) => !ln.right_handed);
        if (i == 0){
          //  lns1.push(s.merge_lines(l_left));
          //    lns2.push(s.merge_lines(l_right));
        } else {
          //  lns2.push(s.merge_lines(l_left));
          //    lns1.push(s.merge_lines(l_right));
        }
      }
  });
  //s.sew(lns1[0], lns1[1]);
  //s.sew(lns2[0], lns2[1]);
}

function sew_neckline(sketches, s){
  let lns1 = [];
  let lns2 = [];
  sketches.forEach((sketch, i) => {
      const lines = sketch.get_typed_lines("back_cut");
      if (lines) {
      }

  });

}
