import { NumberGrid, UInt8Grid } from "Core/grid/types";
import { map } from "./map";

export * from "./chunks";
export * from "./dimensions";
export * from "./from_array";
export * from "./from_function";
export * from "./group";
export * from "./map";
export * from "./resample";
export * from "./types";
export * from "./windows";

export function UInt8_to_f64(g: UInt8Grid): NumberGrid {
    return map("f64", g, (a) => a);
}
