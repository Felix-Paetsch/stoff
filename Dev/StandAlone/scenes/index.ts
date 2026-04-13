import { Polyline, Vector } from "@/Core/geometry";
import { Sketch } from "../../../Core/sketch/sketch";
import { Out, Recording } from "../../lib";

export default function (): Sketch | Sketch[] | void {
    const s = new Sketch();

    const r = Recording.start(s);

    const p = s.add_point(0, 0);
    const q = s.add_point(1, 1);
    // const r = s.point(2, 2);

    const shape = Polyline.from_function(
        (x) => new Vector(x, Math.sin(Math.PI * x)),
    ).resample(0, 0.1);

    s.data.test = "afsd";

    s.line_between_points(p, q, shape);

    // Out.put("hey", Out.prefix("string"));
    // Out.put(s, Out.prefix("sketch"));
    // Out.put(["hey"], Out.prefix("json"));
    // Out.put(new Error("Fake"), Out.prefix("error"));

    Out.put(r);
    Out.put(s);

    const t = s.copy().sketch;
    t.add_point(5, 0);

    return [s, t];
}
