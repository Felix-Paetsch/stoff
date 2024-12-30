import Point from "../point.js";
import Line from "../line.js";
import Sketch from "../sketch.js";

export default function (assert){
    assert.register_assert("CALLBACK", "Callback failed.", (str, fun) => {
        if (typeof str != "string"){
            fun = str;
            str = false;
        }

        return fun() || str;
    });

    assert.register_assert("INVALID_PATH", "An invalid path was reached", () => false);

    assert.register_assert("HAS_SKETCH", "Element doesn't have a registered sketch.", (el, s) => {
        if (!el || typeof el.sketch == "undefined") return "Element has wrong data type.";
        if (!(s instanceof Sketch))
        if (typeof s !== "undefined"){
            assert.IS_SKETCH(s);
            if (el.sketch !== s) return "Element doesn't belong to this sketch.";
            
        } else if (!el.sketch) return "Element doesn't belong to any sketch.";
        return true;
    });

    assert.register_assert("IS_ISOLATED", "Element is not isolated.", (el) => {
        assert.HAS_SKETCH(el);
        if (el instanceof Point) return el.get_adjacent_lines().length == 0;
        return el.p1.get_adjacent_lines().length == 1 && el.p2.get_adjacent_lines().length == 1;
    });

    assert.register_assert("NOT_ISOLATED", "Element is not isolated.", (el) => {
        assert.HAS_SKETCH(el);
        if (el instanceof Point) return el.get_adjacent_lines().length == 0;
        return el.p1.get_adjacent_lines().length == 1 && el.p2.get_adjacent_lines().length == 1;
    });

    assert.register_assert("IS_POINT", "Element isn't a point.", (el) => {
        return el instanceof Point;
    });

    assert.register_assert("IS_LINE", "Element isn't a line.", (el) => {
        return el instanceof Line;
    });

    assert.register_assert("IS_SKETCH", "Element isn't a sketch.", (el) => {
        return el instanceof Sketch;
    })

    assert.register_assert("IS_SKETCH_ELEMENT", "Element is neither line nor point.", (el) => {
        return el instanceof Line || el instanceof Point;
    });

    assert.register_assert("HAS_ENDPOINT", "Element isn't an endpoint of line.", (line, pt) => {
        return line.has_endpoint(pt);
    });

    assert.register_assert("HAS_LINES", "Point is not connected with line(s).", (pt, ...lines) => {
        if (pt.has_lines(...lines)) return;
        for (const l of lines){
            if (!(l instanceof Line)) return "Some element isn't a line."
        }
        return false;
    });

    assert.register_assert("IS_DELETED", "Element isn't deleted.", (el) => {
        if (typeof el?.sketch == "undefined"){
            return "Doesn't make sense to ask if element deleted."
        }

        return !el.sketch;
    });

    assert.register_assert("ONE_ADJACENT_LINE", "Element doesn't have exactly one adjacent line", (el) => {
        assert.N_ADJACENT_LINES(1);
    });

    assert.register_assert("TWO_ADJACENT_LINE", "Element doesn't have exactly two adjacent lines", (el) => {
        assert.N_ADJACENT_LINES(2);
    });

    assert.register_assert("N_ADJACENT_LINES", "Element doesn't have exactly n adjacent lines.", (el, n) => {
        assert.IS_POINT(el);
        assert.HAS_SKETCH(el);
        if (el.get_adjacent_lines().length === n) return true;
        return `Element doesn't have ${ n } adjacent line(s).`
    });

    /* 
        N adjacent lines
        is line
        is point
        same connected component
        same sketch
        has sketch
        adjacent
        valid
    */

    // Utils
    assert.register_method("list", () => {
        return Object.keys(assert.assert_obj());
    });

    assert.assert_obj().register_assert = assert.register_assert;
}