import { FiniteGeometry } from "../finite_geometry";
import { Polyline } from "../shape/polyline";
import { Shape } from "../shape/shape";
import { Vector } from "../vector";

export function as_polyline(g: FiniteGeometry): Polyline {
    if (g instanceof Shape) {
        return g.as_polyline();
    } else if (g instanceof Vector) {
        return Polyline.from_vectors([g]);
    }
    return Polyline.from_vectors(g);
}
