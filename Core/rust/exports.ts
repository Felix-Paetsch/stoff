import { Vector } from "../geometry/index.js";
import init from "./pkg/stoff_rust.js";
// Later will have to do elsewhere probably
await init();

export * from "./pkg/stoff_rust.js";

export function f64_to_vec_array(arr: Float64Array) {
    const res: Vector[] = [];
    for (let i = 0; i < arr.length / 2; i++) {
        res.push(new Vector(arr[2 * i]!, arr[2 * i + 1]!));
    }

    return res;
}
