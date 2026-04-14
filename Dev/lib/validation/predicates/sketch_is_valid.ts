import {
    expect,
    Line,
    merge_validations,
    Point,
    Sketch,
    ValidationFunction,
    ValidationResult,
} from "@/Core";
import { same_sketch } from "./same_sketch";

let currently_validating = false;

export function validate_sketch(sk: Sketch) {
    let reset_validating = !currently_validating;
    currently_validating = true;

    const validation_fns: ValidationFunction[] = [];

    sk.lines().map((l) => validation_fns.push(() => validate_line(l, sk)));

    sk.points().map((p) => validation_fns.push(() => validate_point(p, sk)));

    const res = merge_validations(validation_fns);

    currently_validating = false || !reset_validating;
    return res;
}

function validate_line(l: Line, s: Sketch): ValidationResult {
    const validations: (ValidationFunction | ValidationResult)[] = [
        () => same_sketch(l, s),
        () => sketch_points_as_enpoints(s, l),
        () => no_nan_values(l),
        () => endpoints_have_line(l),
    ];

    return merge_validations(validations);
}

function validate_point(p: Point, s: Sketch) {
    const validations: (ValidationFunction | ValidationResult)[] = [
        () => same_sketch(p, s),
        () => adjacent_lines_have_endpoint(p),
    ];

    return merge_validations(validations);
}

// TEST CASES LINES

function sketch_points_as_enpoints(s: Sketch, l: Line) {
    expect(
        s.has(...l.endpoints()),
        "Line endpoints should be in the same sketch as line.",
    );
}

function no_nan_values(l: Line) {
    l.shape.verticies.forEach((v) => {
        expect(!isNaN(v.x) && !isNaN(v.y), "Some line sample points are NaN.");
    });
}

function endpoints_have_line(l: Line) {
    expect(
        l.p1.adjacent_lines().includes(l) && l.p2.adjacent_lines().includes(l),
        "Line endpoints aren't adjacent to line",
    );
}

// TEST CASES POINTS
function adjacent_lines_have_endpoint(pt: Point) {
    expect(
        pt.adjacent_lines().every((l) => l.has_endpoint(pt)),
        "A point has a line registered that shouldn't be there",
    );
}
