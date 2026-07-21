import {
    Polygon,
    Shape,
    smooth_out,
    Vector,
    walk_without_self_intersections,
} from "@/Core/geometry";
import { Sketch } from "@/Core/sketch";

export default function () {
    const r = new Sketch();
    // Error.stackTraceLimit = Infinity;

    // const params = {
    //     A: 1,
    //     B: 1,
    //     a: 2,
    //     b: 6.5,
    //     o: 0,
    // };
    // const shapeFn: Shape.ShapeFunction = (t) =>
    //     new Vector(
    //         params.A * Math.sin((params.a * t + params.o) * 2 * Math.PI),
    //         params.B * Math.cos(params.b * t * 2 * Math.PI),
    //     );
    //
    // let shape = Shape.from_function(shapeFn);
    //
    // shape = shape.as_polygon();

    const ocillations = 2;
    const shapeFn: Shape.ShapeFunction = (t) =>
        new Vector(Math.sin(ocillations * t * 2 * Math.PI), 0).rotate(
            2 * Math.PI * t,
        );

    let shape = Polygon.from_function(shapeFn);
    shape = walk_without_self_intersections(shape);
    shape = smooth_out(shape, 0.4);

    r.add_line(shape);
    return r;
}
