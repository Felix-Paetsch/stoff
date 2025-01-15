import { EPS, Vector } from "../geometry.js";
import assert from "../assert.js";

import register_sketch_valid from "./sketch_is_valid.js";

export default function (Sketch){
    const Point = Sketch.Point;
    const Line  = Sketch.Line;
    const ConnectedComponent = Sketch.ConnectedComponent;

    assert.register_assert("CALLBACK", "Callback failed.", (str, fun) => {
        if (typeof str != "string"){
            fun = str;
            str = false;
        }

        return fun() || str || undefined;
    });

    assert.register_assert("INVALID_PATH", "An invalid path was reached.", () => false);
    assert.register_assert("THROW", "An error was thrown", (err = false) => err);

    assert.register_assert("HAS_SKETCH", "Element doesn't have a registered sketch.", (el, s) => {
        if (el instanceof ConnectedComponent){
            return assert.HAS_SKETCH(el.root_el);
        }

        if (!el || typeof el.sketch == "undefined") return "Element has wrong data type.";
        if (!(s instanceof Sketch))
        if (typeof s !== "undefined"){
            assert.IS_SKETCH(s);
            if (el.sketch !== s) return "Element doesn't belong to this sketch.";
            
        } else if (!el.sketch) return "Element doesn't belong to any sketch.";
        return true;
    });

    assert.register_assert("HAVE_SKETCH", "Elements doesn't have a registered sketch.", (els, s) => {
        els.forEach(el => {
            assert.HAS_SKETCH(el, s);
        });

        return true;
    });

    assert.register_assert("SAME_SKETCH", "Elements belong to different sketches.", (...args) => {
        assert.HAS_SKETCH(args[0]);
        const s = args[0].sketch;

        for (let i = 1; i < args.length; i++){
            assert.HAS_SKETCH(args[i]);
            if (s !== args[i].sketch){
                return false;
            }
        }
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
    });

    assert.register_assert("IS_VECTOR", "Element isn't a vector.", (vec) => {
        return vec instanceof Vector;
    });

    assert.register_assert("IS_SKETCH_ELEMENT", "Element is neither line nor point.", (el) => {
        return el instanceof Line || el instanceof Point;
    });

    assert.register_assert("IS_CONNECTED_COMPONENT", "Element isn't a connected component.", (el) => {
        return el instanceof ConnectedComponent;
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
        return `Element doesn't have exactly ${ n } adjacent line(s).`
    });

    assert.register_assert("VEC_EQUAL", "Vectors aren't equal.", (vec1, vec2) => {
        if (!(vec1 instanceof Vector && vec2 instanceof Vector)){
            return "Inputs aren't vectors.";
        }

        return vec1.distance(vec2) < EPS.EQUAL;
    });

    assert.register_assert("VEC_NOT_EQUAL", "Vectors are equal.", (vec1, vec2) => {
        if (!(vec1 instanceof Vector && vec2 instanceof Vector)){
            return "Inputs aren't vectors.";
        }

        return vec1.distance(vec2) > EPS.EQUAL;
    });

    assert.register_assert("VEC_ON_LINE", "Vector/Point is not on line.", (vec, line) => {
        assert.IS_VECTOR(vec);
        assert.IS_LINE(line);
        
        return line.closest_position(vec) < EPS.MODERATE;
    });

    assert.register_assert("ADJACENT", "Points/Lines aren't adjacent", (el1, el2) => {
        if (el1 instanceof Point && el2 instanceof Line){
            return assert.HAS_ENDPOINT(el2, el1);
        }
        if (el1 instanceof Line && el2 instanceof Point){
            return assert.HAS_ENDPOINT(el1, el2);
        }
        if (el1 instanceof Line && el2 instanceof Line){
            return el1.common_endpoint(el2);
        }
        if (el1 instanceof Point && el2 instanceof Point){
            for (const line of el1.get_adjacent_lines()){
                if (line.has_endpoint(el2)) return true;
            }
            return false;
        }
        return "Inputs aren't Points/Lines."
    });

    assert.register_assert("PATH_CONNECTED", "Elements don't belong to the same connected component.", (el1, el2) => {
        return el1.connected_component().contains(el2);
    });
    
    register_sketch_valid(Sketch);

    // Utils
    assert.register_method("list", () => {
        return Object.keys(assert);
    });

    // Assert can be used now
    assert.mark_initialized();
}