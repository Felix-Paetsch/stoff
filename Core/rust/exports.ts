import { Vector } from "../geometry/index.js";
export * from "./pkg/stoff_rust.js";

// Later will have to do elsewhere probably
// import init from "./pkg/stoff_rust.js";
// await init();

export function f64_to_vec_array(arr: Float64Array) {
    const res: Vector[] = new Array(arr.length / 2);
    for (let i = 0; i < arr.length / 2; i++) {
        res[i] = new Vector(arr[2 * i]!, arr[2 * i + 1]!);
    }

    return res;
}

export function split_f64_array(arr: Float64Array): Float64Array[] {
    const result: Float64Array[] = [];
    let start = 0;

    for (let i = 0; i < arr.length; i++) {
        if (Number.isNaN(arr[i]!)) {
            if (start < i) {
                result.push(arr.subarray(start, i));
            }
            start = i + 1;
        }
    }

    if (start < arr.length) {
        result.push(arr.subarray(start, arr.length));
    }

    return result;
}

export function f64_to_vec_arrays(arr: Float64Array): Vector[][] {
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

export function vec_arrays_to_f64(lines: Vector[][]): Float64Array {
    if (lines.length === 0) {
        return new Float64Array(0);
    }

    let total = 0;
    for (const line of lines) {
        total += 1 + line.length * 2;
    }

    const result = new Float64Array(total);
    let offset = 0;

    for (const line of lines) {
        result[offset++] = NaN;

        for (const v of line) {
            result[offset++] = v.x;
            result[offset++] = v.y;
        }
    }

    return result;
}

export function f64_arrays_to_f64(arrays: Float64Array[]): Float64Array {
    if (arrays.length === 0) {
        return new Float64Array(0);
    }

    let total = 0;
    for (const arr of arrays) {
        total += 1 + arr.length;
    }

    const result = new Float64Array(total);
    let offset = 0;

    for (const arr of arrays) {
        result[offset++] = NaN;
        result.set(arr, offset);
        offset += arr.length;
    }

    return result;
}
