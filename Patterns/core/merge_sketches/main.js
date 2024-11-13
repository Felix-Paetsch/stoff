import fit_hulls from "./fit_hulls.js";
import Sketch from "../../../StoffLib/sketch.js";
import { convex_hull, Vector, rotation_fun, vec_angle_clockwise, UP, vec_angle} from "../../../StoffLib/geometry.js";
import CONF from '../../../StoffLib/config.json' assert { type: 'json' };

export default function merge_sketches(sketches, min_padding = 0.5, type = "A4", visualize = false){
    /*
        {
            "type": "fabric_roll", (optional)
            "width": 50
        }
        "A4"
    */

    const s = new Sketch();

    const hulls = sketches.map(s => {
        const up_direction = s.data?.up_direction || UP;
        if (vec_angle(up_direction, UP) !== 0){
            const rot_fun = rotation_fun(new Vector(0,0), vec_angle_clockwise(up_direction, UP));

            s = s.copy().transform(pt => {
                pt.set(rot_fun(pt));
            });
        }

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
            sketch: s,
        }
    });


    let new_hulls;
    if (type == "A4"){
        const A4_width  = CONF["PRINTABLE_WIDTH_CM"]  - 2*CONF["PRINT_PADDING_CM"];
        const A4_height = CONF["PRINTABLE_HEIGHT_CM"] - 2*CONF["PRINT_PADDING_CM"];

        const hull_options = [];
        
        for (let i of [1,2,3,4,5]){
            try{
                hull_options.push(
                    fit_hulls(hulls.map(h => h.hull), i * 5, min_padding)
                );
            } catch {}
        }

        for (let i of [1,2,3,4,5]){
            try{
                hull_options.push(
                    fit_hulls(hulls.map(h => h.hull), i*5, min_padding, true)
                );
            } catch{}
        }

        let best = [0, 1000000]; // Inndex and amt of paper

        for (let i in hull_options){
            const bb = collective_bb(hull_options[i]);
            const amt = Math.ceil(bb.width/A4_width) * Math.ceil(bb.height/A4_height);
            if (best[1] > amt){
                best = [i, amt];
            }
        }

        new_hulls = hull_options[best[0]];
    } else if (type?.width || type?.height){
        new_hulls = type.width ?
            fit_hulls(hulls.map(h => h.hull), type.width, min_padding)
        :   fit_hulls(hulls.map(h => h.hull), type.height, min_padding, true);
    }

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

    s.data.up_direction = new Vector(0,1);
    return s;
}

function collective_bb(hulls) {
    if (hulls.length === 0) return null;

    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;

    for (const hull of hulls) {
        for (const point of hull) {
            minX = Math.min(minX, point.x);
            minY = Math.min(minY, point.y);
            maxX = Math.max(maxX, point.x);
            maxY = Math.max(maxY, point.y);
        }
    }

    return {
        top_left: new Vector(minX, minY),
        bottom_right: new Vector(maxX, maxY),
        width: maxX - minX,
        height: maxY - minY
    };
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