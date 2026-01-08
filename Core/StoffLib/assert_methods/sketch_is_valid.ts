import assert, { merge_validations, ValidationFunction, ValidationResult } from "../../assert";
import { Vector, ZERO } from "../geometry.js";
import CONF from "../config.json" with { type: "json" };
import Line from "../line.js";
import Point from "../point.js";
import { at_url } from "../../Debug/render_at.js";
import Sketch from "../sketch";
import { has_sketch } from "./exports.js";
import ConnectedComponent from "../connected_component.js";

let currently_validating = false;

export function validate_sketch(sk: Sketch) {
    let reset_validating = !currently_validating;
    currently_validating = true;

    const validation_fns: ValidationFunction[] = [];

    sk.get_lines().map(l => validation_fns.push(
        () => validate_line(l, sk)
    ))

    sk.get_points().map(p => validation_fns.push(
        () => validate_point(p, sk)
    ))

    validation_fns.push(
        () => data_object_valid(sk.data, sk)
    );

    const res = merge_validations(validation_fns);

    currently_validating = false || !reset_validating;
    return res;
}

function validate_line(l: Line, s: Sketch): ValidationResult {
    const validations: (ValidationFunction | ValidationResult)[] = [
        () => has_sketch(l, s),
        () => relative_endpoints_are_correct(l),
        () => sketch_points_as_enpoints(s, l),
        () => no_nan_values(l),
        () => data_object_valid(l.data, s),
        () => endpoints_have_line(l),
    ];

    if (CONF.ASSERT_NON_SELFINTERSECTING) {
        validations.push(
            () => line_doesnt_self_intersect(
                l,
                () => {
                    l.attributes.stroke = "red";
                    l.attributes.opacity = 0.9;
                    if (l.data) {
                        l.data.SELF_INTERSECTS = true;
                    }
                    at_url(s, "/self_intersects", false);

                    Error.stackTraceLimit = Infinity;
                    return "A line self intersected! \nYou may visit /self_intersects to see the problem.\n"
                }
            )
        )
    }

    return merge_validations(validations);
}

function validate_point(
    p: Point,
    s: Sketch
) {
    const validations: (ValidationFunction | ValidationResult)[] = [
        () => has_sketch(p, s),
        () => adjacent_lines_have_endpoint(p),
        () => data_object_valid(p.data, s),
    ];

    return merge_validations(validations);
}

// TEST CASES LINES

function relative_endpoints_are_correct(l: Line) {
    if (!l.get_sample_points()[0].equals(ZERO)) {
        return "Line sample points don't start with (0,0).";
    }

    if (!l.get_sample_points()[1].equals(new Vector(1, 0))) {
        ("Line sample points don't end with (1,0).");
    }
}

function sketch_points_as_enpoints(s: Sketch, l: Line) {
    assert(
        s.has(...l.get_endpoints()),
        "Line endpoints should be in the same sketch as line."
    );
}

function no_nan_values(l: Line) {
    l.get_sample_points().forEach((p) => {
        assert(
            !isNaN(p.x) && !isNaN(p.y),
            "Some line sample points are NaN."
        );
    });
}

function line_doesnt_self_intersect(l: Line, callback = () => { }) {
    if (l.self_intersects()) {
        callback();
        return "Line heuristically self intersects";
    }
}

function endpoints_have_line(l: Line) {
    assert(
        l.p1.get_adjacent_lines().includes(l) &&
        l.p2.get_adjacent_lines().includes(l),
        "Line endpoints aren't adjacent to line"
    );
}

// TEST CASES POINTS
function adjacent_lines_have_endpoint(pt: Point) {
    assert(
        pt.get_adjacent_lines().every((l) => l.has_endpoint(pt)),
        "A point has a line registered that shouldn't be there"
    );
}

// TEST CASES SKETCH
function data_object_valid(data: any, s: Sketch) {
    let nesting = 0;
    nesting_buffer(data);

    function nesting_buffer(data: any): any {
        nesting++;
        if (nesting > 50) {
            throw new Error(
                "Data nesting to deep! Circular data structure?"
            );
        }

        // Basic Stuff
        if (
            [
                "undefined",
                "boolean",
                "number",
                "bigint",
                "string",
                "symbol",
            ].includes(typeof data)
        ) {
            return nesting--;
        }

        if (data == null) {
            return nesting--;
        }

        // Arrays
        if (data instanceof Array) {
            nesting--;
            return data.map(nesting_buffer);
        }

        // Basic dicts
        if (data.constructor === Object) {
            for (const key in data) {
                nesting_buffer(data[key]);
            }
            return nesting--;
        }

        // Points
        if (data instanceof Point) {
            assert(
                s.has(data),
                "Object data references point not in sketch"
            );
            return nesting--;
        }

        // Vectors
        if (data instanceof Vector) {
            return nesting--;
        }

        // Lines
        if (data instanceof Line) {
            assert(
                s.has(data),
                "Object data references line not in sketch"
            );
            return nesting--;
        }

        if (data instanceof ConnectedComponent) {
            assert(
                s.has(data.root()),
                "Root element of ConnectedCompoonent doesnt belong to sketch"
            );
            return nesting--;
        }

        assert(
            false,
            "Object data somewhere has object of unhandled datatype (Invalid data type)"
        );
    }
}
