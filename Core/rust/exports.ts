import { Vector } from "../geometry/index.js";
import init from "./pkg/stoff_rust.js";
// Later will have to do elsewhere probably
await init();

export * from "./pkg/stoff_rust.js";

export function f64_to_vec_array(arr: Float64Array) {
    const res: Vector[] = new Array(arr.length / 2);
    for (let i = 0; i < arr.length / 2; i++) {
        res.push(new Vector(arr[2 * i]!, arr[2 * i + 1]!));
    }

    return res;
}

export function split_f64_array(arr: Float64Array): Float64Array[] {
    const result: Float64Array[] = [];
    let start = 0;

    for (let i = 0; i < arr.length; i++) {
        if (Number.isNaN(arr[i]!)) {
            result.push(arr.subarray(start, i));
            start = i + 1;
        }
    }

    result.push(arr.subarray(start, arr.length));

    return result;
}

export function f64_array_to_vec_arrays(arr: Float64Array): Vector[][] {
    const segments = split_f64_array(arr);
    const result: Vector[][] = new Array(segments.length);

    for (let s = 0; s < segments.length; s++) {
        const seg = segments[s]!;
        const len = seg.length >> 1;
        const vectors = new Array<Vector>(len);

        for (let i = 0; i < len; i++) {
            const j = i << 1;
            vectors[i] = new Vector(seg[j]!, seg[j + 1]!);
        }

        result[s] = vectors;
    }

    return result;
}
