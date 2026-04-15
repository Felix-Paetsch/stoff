import { Polyline, Vector } from "..";
import { FiniteGeometry } from "../finite_geometry";
import { Shape } from "../shape/shape";

export function as_polyline(g: FiniteGeometry) {
    if (g instanceof Shape) {
        return g.as_polyline();
    } else if (g instanceof Vector) {
        return Polyline.from_vectors([g]);
    }
    return Polyline.from_vectors(g);
}

export function merge_float_arrays(arrays: Float64Array[]): Float64Array {
    let totalLength = 0;
    for (const arr of arrays) {
        totalLength += arr.length;
    }

    const result = new Float64Array(totalLength);

    let offset = 0;
    for (const arr of arrays) {
        result.set(arr, offset);
        offset += arr.length;
    }

    return result;
}
