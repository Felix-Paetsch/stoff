import { Copy, Polyline, Sketch, Vector } from "../../../Core/index";
import { TestCase } from "../build_tests";

const test: TestCase = function () {
    const s = new Sketch();

    const p = s.add_point(0, 0);
    const q = s.add_point(1, 1);
    // const r = s.point(2, 2);

    const shape = Polyline.from_function(
        (x) => new Vector(x, Math.sin(Math.PI * x)),
    ).resample_smooth(0, 0.1);

    s.data.test = "afsd";

    s.line_between_points(p, q, shape);

    const t = Copy.sketch(s).sketch;
    t.add_point(5, 0);

    return [s, t];
};

export default test;
