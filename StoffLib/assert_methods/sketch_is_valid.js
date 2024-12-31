import assert from '../assert.js';
import { Vector, ZERO } from '../geometry.js';
import CONF from '../config.json' assert { type: 'json' };
import Line from '../line.js';
import Point from '../point.js';

let currently_validating = false;
export default function register_sketch_valid(Sketch){
    assert.register_assert("IS_VALID", "Sketch/Line/Point is not valid.", (el) => {
        let reset_validating = !currently_validating;
        currently_validating = true;

        if (el instanceof Sketch){
            for (const l of el.lines){
                assert.IS_VALID(l);
            }
    
            for (const p of el.points){
                assert.IS_VALID(p);
            }
        
            const res = data_object_valid(el.data, el);
            currently_validating = false || !reset_validating;
            return res;
        }
        
        if (el instanceof Line){
            const l = el;
            assert.HAS_SKETCH(l);
            const s = el.sketch;

            const res = [
                relative_endpoints_are_correct(l),
                sketch_points_as_enpoints(s, l),
                no_nan_values(l),
                data_object_valid(l.data, s),
                endpoints_have_line(l)
            ]

            for (const r of res){
                if (r !== true && typeof r !== "undefined"){
                    currently_validating = false || !reset_validating;
                    return r;
                }
            }
            

            if (CONF.ASSERT_NON_SELFINTERSECTING){
                line_doesnt_self_intersect(
                    l,
                    () => {
                        l.attributes.stroke = "red";
                        l.attributes.opacity = 0.9;
                        if (l.data){
                            l.data.SELF_INTERSECTS = true;
                        }
                        s.dev.at_url("/self_intersects", false);
                        
                        Error.stackTraceLimit = Infinity;
                        assert.THROW("A line self intersected! \nYou may visit /self_intersects to see the problem.\n");
                    } // Callback before the assert
                );
            }

            currently_validating = false || !reset_validating;
            return;
        }

        if (el instanceof Point){
            const p = el;
            assert.HAS_SKETCH(p);
            const s = el.sketch;

            const res = [
                pt_has_lines_only_in_sketch(s, p),
                data_object_valid(p.data, s)
            ]

            for (const r of res){
                if (r !== true && typeof r !== "undefined") return r;
            }

            currently_validating = false || !reset_validating;
            return;
        }

        throw assert.THROW("IS_VALID only works for Sketches/Points/Lines.");
    });


    // TEST CASES LINES

    function relative_endpoints_are_correct(l){
        if (!l.get_sample_points()[0].equals(ZERO)) {
            return "Line sample points don't start with (0,0)."
        }

        if (!l.get_sample_points()[1].equals(new Vector(1,0))) {
            "Line sample points don't end with (1,0)."
        }
    }

    function sketch_points_as_enpoints(s, l){
        assert(
            l.p1 instanceof Point && l.p2 instanceof Point,
            "Line doesn't have points as endpoints."
        );

        assert(
            s.has_points(...l.get_endpoints()),
            "Line endpoints should be in the same sketch as line."
        );
    }

    function no_nan_values(l){
        l.get_sample_points().forEach(p => {
            assert(!isNaN(p.x) && !isNaN(p.y), "Some line sample points are NaN.")
        });
    }

    function line_doesnt_self_intersect(l, callback = () => {}){
        if (l.self_intersects()){
            callback();
            return "Line heuristically self intersects";
        }
    }

    function endpoints_have_line(l){
        assert(
            l.p1.get_adjacent_lines().includes(l)
            && l.p2.get_adjacent_lines().includes(l),
            "Line endpoints aren't adjacent to line"
        );
    }

    // TEST CASES POINTS
    function pt_has_lines_only_in_sketch(s, pt){
        assert(
            s.has_lines(...pt.get_adjacent_lines()),
            "Point has lines not in sketch"
        );
    }


    // TEST CASES SKETCH
    function data_object_valid(data, s){
        let nesting = 0;
        nesting_buffer(data);

        function nesting_buffer(data){
            nesting++;
            if (nesting > 50){
                throw new Error("Data nesting to deep! Circular data structure?");
            }

            // Basic Stuff
            if ([
                "undefined",
                "boolean",
                "number",
                "bigint",
                "string",
                "symbol"
            ].includes(typeof data)){
                return nesting--;
            }

            if (data == null){
                return nesting--;
            }

            // Arrays
            if (data instanceof Array){
                nesting--;
                return data.map(nesting_buffer);
            }

            // Basic dicts
            if (data.constructor === Object){
                for (const key in data){
                    nesting_buffer(data[key])
                }
                return nesting--;
            }

            // Points
            if (data instanceof Point){
                assert(s.has_points(data), "Object data references point not in sketch");
                return nesting--;
            }

            // Vectors
            if (data instanceof Vector){
                return nesting--;
            }

            // Lines
            if (data instanceof Line){
                assert(s.has_lines(data), "Object data references line not in sketch");
                return nesting--;
            }

            if (data instanceof ConnectedComponent){
                assert(s.has(data.root_el), "Root element of ConnectedCompoonent doesnt belong to sketch");
                return nesting--;
            }

            assert.THROW("Object data somewhere has object of unhandled datatype (Invalid data type)");
        }
    }
}