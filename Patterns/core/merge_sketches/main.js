import fit_hulls from "./fit_hulls.js";
import Sketch from "../../../StoffLib/sketch.js";
import { convex_hull, Vector } from "../../../StoffLib/geometry.js";

export default function merge_sketches(sketches, min_padding = 0.5, visualize = false){
    const s = new Sketch();

    const hulls = sketches.map(s => {
        const original_hull = s.convex_hull();

        if (original_hull.length == 0) return {
            original_hull,
            hull: [],
            copy_offset: new Vector(0,0),
            sketch: s
        }

        const hull = pad_hull(original_hull, min_padding);
        const bb = s.get_bounding_box();
        return {
            original_hull,
            hull,
            bb,
            sketch: s
        }
    });
    
    const new_hulls = fit_hulls(hulls.map(h => h.hull), 100);
    for (let i = 0; i < hulls.length; i++){
        hulls[i].new_hull = new_hulls[i];
    }

    for (let h of hulls){
        if (h.hull.length > 0){
            s.paste_sketch(
                h.sketch, null, h.bb.top_left
                    .add(h.new_hull[0])
                    .subtract(h.hull[0])
            );
        }

        if (visualize){
            {
                const pts = [];
                for (let i = 0; i < h.original_hull.length; i++){
                    pts.push(
                        s.point(
                            h.original_hull[i]
                            .add(h.new_hull[0])
                            .subtract(h.hull[0])
                        ).set_color("red"));
                }
                for (let i = 0; i < pts.length; i++){
                    s.line_between_points(pts[i], pts[(i + 1) % pts.length]).set_color("red");
                }
            }
            {
                const pts = [];
                for (let i = 0; i < h.new_hull.length; i++){
                    pts.push(s.point(h.new_hull[i]).set_color("green"));
                }
                for (let i = 0; i < pts.length; i++){
                    s.line_between_points(pts[i], pts[(i + 1) % pts.length]).set_color("green");
                }
            }
        }        
    }

    return s;
}

function pad_hull(hull, padding = 0){
    return padding == 0 ? hull : convex_hull(
        hull.map(p => {
            return [
                // SQRT2 to take care of diagonal, /2 bcs both sides have padding
                p.add(new Vector(0, Math.SQRT1_2 * padding)),
                p.add(new Vector(0, -Math.SQRT1_2 * padding)),
                p.add(new Vector(Math.SQRT1_2 * padding), 0),
                p.add(new Vector(-Math.SQRT1_2 * padding), 0)
            ]
        }).flat()
    )
}