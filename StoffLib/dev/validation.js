import Point from '../point.js';
import Line from '../line.js';
import { Vector } from '../geometry.js';
import { ConnectedComponent } from '../connected_component.js';
import { Sketch } from "../sketch.js";
import { assert, try_with_error_msg } from '../../Debug/validation_utils.js';


import CONF from '../config.json' assert { type: 'json' };
const error_margin = CONF.VAL_ERROR_MARGIN;
let currently_validating = false;

function validate_sketch(s){
    if (currently_validating) return;
    currently_validating = true;

    s.lines.forEach(l => {
        relative_endpoints_are_correct(l);
        sketch_points_as_enpoints(s, l);
        points_are_in_sketch(s, l);
        no_nan_values(l);
        data_object_valid(l.data, s);
        endpoints_have_line(l);

        if (CONF.ASSERT_NON_SELFINTERSECTING){
            line_doesnt_self_intersect(
                l,
                () => {
                    l.attributes.stroke = "red";
                    l.attributes.opacity = 0.9;
                    if (l.data){
                        l.data.SELF_INTERSECTS = true;
                    }
                    s.dev.at_url("/self_intersects", null, true);
                    
                    Error.stackTraceLimit = Infinity;
                    throw new Error("A line self intersected! \nYou may visit /self_intersects to see the problem.\n");
                } // Callback before the assert
            );
        }

        // sufficent_sample_point_spacing(l, error_margin);
    });

    s.points.forEach(p => {
        pt_has_lines_only_in_sketch(s, p);
        data_object_valid(p.data, s);
    });

    data_object_valid(s.data, s);
    currently_validating = false;
}

// TEST CASES LINES

function relative_endpoints_are_correct(l){
    // First sample point is (0,0)
    // Last  sample point is (1,0)
    assert(
        approx_eq(l.sample_points[0].x, 0)
        && approx_eq(l.sample_points[0].y, 0),
        "Test Failed: Line starts with (0,0)"
    );

    assert(
        approx_eq(l.sample_points[l.sample_points.length - 1].x, 1)
        && approx_eq(l.sample_points[l.sample_points.length - 1].y, 0),
        "Test Failed: Line ends with (1,0)"
    );
}

function sketch_points_as_enpoints(s, l){
    assert(
        l.p1 instanceof Point && l.p2 instanceof Point,
        "Test Failed: Line should have points as endpoints"
    );

    assert(
        s.has_points(...l.get_endpoints()),
        "Test Failed: Line endpoints should be in same sketch"
    );
}

function no_nan_values(l){
    l.get_sample_points().forEach(p => {
        assert(!isNaN(p.x) && !isNaN(p.y), "Test Failed: Some line sample points are NaN")
    });
}

function points_are_in_sketch(s, l){
    assert(
        s.has_points(...l.get_endpoints()),
        "Test failed: Line endpoints are not in sketch"
    );
}

function sufficent_sample_point_spacing(l, min_distance){
    const sp = l.get_sample_points();
    for (let i = 0; i < sp.length - 2; i++){
        assert(
            sp[i].subtract(sp[i+1]).length() > min_distance,
            "Test failed: Sample points are to tightly spaced"
        );
    }
}

function line_doesnt_self_intersect(l, callback = () => {}){
    if (l.self_intersects()){
        callback();
        throw new Error("Test failed: Line heuristically self intersects");
    }
}

/*
let once_self_intersected = false;
function line_doesnt_self_intersect(l){
    if (l.self_intersects() && !once_self_intersected) {
      once_self_intersected = true;
        const s = new Sketch();
        const p1 = s.point(0,0);
        const p2 = s.point(0,1);
        s.point(1,2);
        s.copy_line(l, p1, p2);
        s.save_as_png("Debug.png", 500, 500);
        throw new Error("Intersections Found");
    }

    // assert(!l.self_intersects(), "Test failed: Line self intersects");
}
*/

function endpoints_have_line(l){
    assert(
        l.p1.get_adjacent_lines().includes(l)
        && l.p2.get_adjacent_lines().includes(l),
        "Line endpoints adjacent to line"
    );
}

// TEST CASES POINTS

function pt_has_lines_only_in_sketch(s, pt){
    assert(
        s.has_lines(...pt.get_adjacent_lines()),
        "Test failed: Point has lines not in sketch"
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

        throw new Error("Object data somewhere has object of unhandled datatype (Invalid data type)");
    }
}

function approx_eq(a,b = 0){
    return Math.abs(a-b) < error_margin
}

export { assert, try_with_error_msg, validate_sketch };
