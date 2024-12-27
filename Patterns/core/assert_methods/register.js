import { Point } from "../../../StoffLib/point.js";

export default function register(assert){
    assert.register_check("HAS_SKETCH", "Element doesn't have a registered sketch.", (el) => {
        if (!el || typeof el.sketch == "undefined") return "Element has wrong data type.";
        if (!el.sketch) return "Element doesn't belong to sketch.";
        return true;
    });

    assert.register_check("IS_ISOLATED", "Element is not isolated.", (el) => {
        assert.HAS_SKETCH(el);
        if (el instanceof Point) return el.get_adjacent_lines().length == 0;
        return el.p1.get_adjacent_lines().length == 1 && el.p2.get_adjacent_lines().length == 1;
    });

    assert.register_check("NOT_ISOLATED", "Element is not isolated.", (el) => {
        assert.HAS_SKETCH(el);
        if (el instanceof Point) return el.get_adjacent_lines().length == 0;
        return el.p1.get_adjacent_lines().length == 1 && el.p2.get_adjacent_lines().length == 1;
    });

    assert.register_check("IS_POINT", "Element isn't a point.", (el) => {

    });

    assert.register_check("ONE_ADJACENT_LINE", "Element doesn't have exactly one adjacent line", (el) => {

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
        invalid path
    */
}