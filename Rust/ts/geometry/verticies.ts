import { Vector } from "@/Core";

export function vecf64_to_vertex_vec(arr: Float64Array): Vector[] {
    const res: Vector[] = new Array(arr.length / 2);
    for (let i = 0; i < arr.length / 2; i++) {
        res[i] = new Vector(arr[2 * i]!, arr[2 * i + 1]!);
    }

    return res;
}

export function vertex_vec_to_vecf64(arr: Vector[]): Float64Array {
    let res = new Float64Array(arr.length * 2);
    let index = 0;

    arr.forEach((v) => {
        res[index++] = v.x;
        res[index++] = v.y;
    });

    return res;
}

export function vecf64_to_vertex_vec_vec(arr: Float64Array): Vector[][] {
    if (arr.length == 0) return [];

    const res: Vector[][] = [];
    let current: Vector[] = [];

    // Ignoring first nan
    for (let i = 1; i < arr.length; i += 2) {
        if (Number.isNaN(arr[i])) {
            res.push(current);
            current = [];
            i++;
            continue;
        }
        current.push(new Vector(arr[i]!, arr[i + 1]!));
    }

    res.push(current);
    return res;
}

export function vertex_vec_vec_to_vecf64(lines: Vector[][]): Float64Array {
    const totalLength = lines.reduce(
        (sum, subarray) => sum + 2 * subarray.length + 1,
        0,
    );
    const res = new Float64Array(totalLength);

    let offset = 0;
    for (const line of lines) {
        res[offset++] = NaN;

        for (const v of line) {
            res[offset++] = v.x;
            res[offset++] = v.y;
        }
    }

    return res;
}
