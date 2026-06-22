import { GridWindow, GridWindowFunction } from "Core/grid/grids/index";
import { NumberGrid } from "Core/grid/types";
import {
    wasm_grid_convolve_f64,
    WASMCompatability,
    WASMTransmittableConvolutionKernel,
} from "Rust/exports";
import { ConvolutionKernel } from "./convolution_kernel";

export type RModuleStructure<T> = {
    add(a: T, b: T): T;
    scale(a: T, b: number): T;
    zero: T;
};

export function general_kernel_convolution_function<T>(
    s: RModuleStructure<T>,
    k: ConvolutionKernel,
): GridWindowFunction<T, T> {
    return (w: GridWindow<T>) => {
        let res: T = s.zero;
        let matrix = k.matrix_ref();

        for (let y = 0; y < k.rows; y++) {
            for (let x = 0; x < k.columns; x++) {
                res = s.add(res, s.scale(w([x, y]), matrix[y]![x]!));
            }
        }
        return res;
    };
}

export function convolve(s: NumberGrid, k: ConvolutionKernel): NumberGrid {
    const grid_ser = WASMCompatability.Grid.serialize_number_grid(s);
    const ker = WASMTransmittableConvolutionKernel.new(
        k.columns,
        k.rows,
        new Float64Array(k.matrix_ref().flat()),
    );
    const res = wasm_grid_convolve_f64(grid_ser, ker);
    return WASMCompatability.Grid.deserialize_number_grid(res);
}
