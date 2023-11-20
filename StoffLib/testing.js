const error_margin = .00001

function validate_sketch(s){
    // First sample point is (0,0)
    // Last  sample point is (1,0)
    s.lines.forEach(l => {
        assert(
            approx_eq(l.sample_points[0].x, 0)
            && approx_eq(l.sample_points[0].y, 0),
            "Line starts with (0,0)"
        );

        assert(
            approx_eq(l.sample_points[l.sample_points.length - 1].x, 1)
            && approx_eq(l.sample_points[l.sample_points.length - 1].y, 0),
            "Line ends with (1,0)"
        );
    });
}

function approx_eq(a,b = 0){
    return Math.abs(a-b) < error_margin
}

function assert(bool, error){
    if (!bool){
        throw new Error(error);
    }
}

module.exports = { assert, validate_sketch }