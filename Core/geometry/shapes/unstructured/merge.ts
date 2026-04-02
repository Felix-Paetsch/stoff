import { Vector } from "../../classes";
import { is_polygon, Polyline, Shape } from "../polyline";

export function merge_shapes(s1: Shape, s2: Shape): Shape {
    if (is_polygon(s1) || is_polygon(s2)) {
        throw new Error("Unimplemented");
    }

    const sp1 = s1.verticies;
    const sp2 = s2.verticies;
    if (Vector.equals(s1.last(), s2.first())) {
        return new Polyline(sp1.concat(sp2.slice(1)));
    }

    if (Vector.equals(s1.first(), s2.last())) {
        return new Polyline(sp2.concat(sp1.slice(1)));
    }

    if (Vector.equals(s1.first(), s2.first())) {
        return new Polyline([...sp1].reverse().concat(sp2.slice(1)));
    }

    if (Vector.equals(s1.last(), s2.last())) {
        return new Polyline(sp1.slice(0, -1).concat([...sp2].reverse()));
    }

    throw new Error("Shapes don't touch");
}
