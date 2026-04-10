import { Sketch } from "../../../Core/sketch/sketch";

export default function (): Sketch | Sketch[] | void {
    const s = new Sketch();

    const p = s.point(0, 0);
    const q = s.point(1, 1);
    // const r = s.point(2, 2);

    s.line_from_function_graph(p, q, (x) => Math.sin(Math.PI * x));

    return s;
}
